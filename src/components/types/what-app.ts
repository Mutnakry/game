/**
 * Represents a single What App entry
 */
export interface WhatAppEntry {
    /**
     * The what app value/name
     */
    whatapp: string
  
    /**
     * Optional document ID for Firebase
     */
    id?: string
  
    /**
     * Optional created timestamp
     */
    createdAt?: string
  
    /**
     * Optional updated timestamp
     */
    updatedAt?: string
  }
  
  /**
   * State for the WhatAppForm component
   */
  export interface WhatAppFormState {
    /**
     * All available what app entries
     */
    entries: WhatAppEntry[]
  
    /**
     * Index of the entry currently being edited, or null if none
     */
    editingIndex: number | null
  }
  
  /**
   * State for the SingleWhatAppForm component
   */
  export interface SingleWhatAppState {
    /**
     * The current what app entry
     */
    entry: WhatAppEntry | null
  
    /**
     * Whether the form is in edit mode
     */
    isEditing: boolean
  
    /**
     * Whether the form is loading
     */
    isLoading: boolean
  }
  