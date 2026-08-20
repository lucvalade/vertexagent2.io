// Centralized Admin Autosave Registry & Dispatcher
// Automatically triggers save operations across admin screens when navigating away or switching routes

type AutosaveHandler = () => Promise<any> | void;
type IsDirtyChecker = () => boolean;

interface AutosaveEntry {
  id: string;
  name?: string;
  saveFn: AutosaveHandler;
  isDirty: IsDirtyChecker;
}

class AdminAutosaveManager {
  private handlers = new Map<string, AutosaveEntry>();

  /**
   * Register an admin component or form with the autosave manager
   */
  register(id: string, saveFn: AutosaveHandler, isDirty: IsDirtyChecker, name?: string) {
    this.handlers.set(id, { id, name, saveFn, isDirty });
    return () => {
      this.unregister(id);
    };
  }

  /**
   * Unregister an admin component
   */
  unregister(id: string) {
    this.handlers.delete(id);
  }

  /**
   * Check if any registered admin screens have unsaved changes
   */
  hasUnsavedChanges(): boolean {
    for (const entry of this.handlers.values()) {
      try {
        if (entry.isDirty()) return true;
      } catch (e) {
        console.warn(`[AdminAutosave] Error checking isDirty for ${entry.id}:`, e);
      }
    }
    return false;
  }

  /**
   * Trigger autosave on all registered dirty admin components
   */
  async triggerAutosaveAll(): Promise<{ savedCount: number; errors: any[] }> {
    let savedCount = 0;
    const errors: any[] = [];

    for (const entry of this.handlers.values()) {
      try {
        if (entry.isDirty()) {
          console.log(`[AdminAutosave] Auto-saving changes for ${entry.name || entry.id}...`);
          await Promise.resolve(entry.saveFn());
          savedCount++;
        }
      } catch (err) {
        console.error(`[AdminAutosave] Failed to auto-save ${entry.id}:`, err);
        errors.push({ id: entry.id, error: err });
      }
    }

    return { savedCount, errors };
  }
}

export const adminAutosave = new AdminAutosaveManager();
