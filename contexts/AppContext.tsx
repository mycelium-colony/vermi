import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Define action types
const SET_AUTH = 'SET_AUTH';
const SET_RELAY_CONNECTIONS = 'SET_RELAY_CONNECTIONS';
const SET_FEED_POSITION = 'SET_FEED_POSITION';

// Define state and action types
interface AppState {
  isAuthenticated: boolean;
  user: any; // Replace 'any' with a specific user type if available
  relayConnections: Record<string, any>; // Replace 'any' with a specific connection type if available
  feedPosition: number;
}

interface SetAuthAction {
  type: typeof SET_AUTH;
  payload: {
    isAuthenticated: boolean;
    user: any;
  };
}

interface SetRelayConnectionsAction {
  type: typeof SET_RELAY_CONNECTIONS;
  payload: Record<string, any>;
}

interface SetFeedPositionAction {
  type: typeof SET_FEED_POSITION;
  payload: number;
}

// Union type for all actions
type AppAction = SetAuthAction | SetRelayConnectionsAction | SetFeedPositionAction;

// Define initial state
const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  relayConnections: {},
  feedPosition: 0,
};

// Create context
const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | null>(null);

// Define reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case SET_AUTH:
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
      };
    case SET_RELAY_CONNECTIONS:
      return {
        ...state,
        relayConnections: action.payload,
      };
    case SET_FEED_POSITION:
      return {
        ...state,
        feedPosition: action.payload,
      };
    default:
      return state;
  }
}

// Create provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial state from local storage
  useEffect(() => {
    const storedState = localStorage.getItem('appState');
    if (storedState) {
      dispatch({ type: SET_AUTH, payload: JSON.parse(storedState) });
    }
  }, []);

  // Save state to local storage on change
  useEffect(() => {
    localStorage.setItem('appState', JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the app context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Action creators
export const setAuth = (isAuthenticated: boolean, user: any): SetAuthAction => ({
  type: SET_AUTH,
  payload: { isAuthenticated, user },
});

export const setRelayConnections = (connections: Record<string, any>): SetRelayConnectionsAction => ({
  type: SET_RELAY_CONNECTIONS,
  payload: connections,
});

export const setFeedPosition = (position: number): SetFeedPositionAction => ({
  type: SET_FEED_POSITION,
  payload: position,
}); 