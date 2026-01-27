// Global verbose state for CLI
let verboseEnabled = false;

export function setVerbose(enabled: boolean): void {
  verboseEnabled = enabled;
}

export function isVerbose(): boolean {
  return verboseEnabled;
}

export function verboseLog(message: string): void {
  if (verboseEnabled) {
    console.error(message);
  }
}
