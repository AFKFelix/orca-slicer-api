import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

export interface HealthCheck {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: {
    orcaslicer: {
      available: boolean;
      version?: string;
      error?: string;
    };
    dataPath: {
      accessible: boolean;
      error?: string;
    };
  };
}

export async function checkHealth(): Promise<HealthCheck> {
  const timestamp = new Date().toISOString();
  const checks: HealthCheck["checks"] = {
    orcaslicer: {
      available: false,
    },
    dataPath: {
      accessible: false,
    },
  };

  try {
    const orcaPath = process.env.ORCASLICER_PATH || "/app/squashfs-root/AppRun";
    await fs.access(orcaPath, fs.constants.X_OK);
    
    try {
      const helpOutput = execFileSync(orcaPath, ["--help"], {
        encoding: "utf-8",
        timeout: 5000,
      });

      // Extract version from output like "OrcaSlicer-2.3.1:" or "OrcaSlicer-01.10.01.50:"
      const versionMatch = helpOutput.match(/OrcaSlicer-([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : "unknown";
      
      checks.orcaslicer.available = true;
      checks.orcaslicer.version = version;
    } catch (versionError: any) {
      if (versionError.status !== undefined && versionError.status !== 0) {
        checks.orcaslicer.available = false;
        checks.orcaslicer.error = `OrcaSlicer exited with code ${versionError.status}: ${versionError.message}`;
      } else {
        checks.orcaslicer.available = false;
        checks.orcaslicer.error =
          versionError instanceof Error ? versionError.message : String(versionError);
      }
    }
  } catch (error) {
    checks.orcaslicer.available = false;
    checks.orcaslicer.error =
      error instanceof Error ? error.message : String(error);
  }

  try {
    const dataPath = process.env.DATA_PATH || path.join(process.cwd(), "data");
    await fs.access(dataPath, fs.constants.R_OK | fs.constants.W_OK);
    checks.dataPath.accessible = true;
  } catch (error) {
    checks.dataPath.accessible = false;
    checks.dataPath.error =
      error instanceof Error ? error.message : String(error);
  }

  const status =
    checks.orcaslicer.available && checks.dataPath.accessible
      ? "healthy"
      : "unhealthy";

  return {
    status,
    timestamp,
    checks,
  };
}
