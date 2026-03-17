import type { BoardState, BoardAction } from "./board.types";

export const initialState: BoardState = {
  columns: [],
  loading: true,
  error: null,
  adding: false,
  newColumnName: "",
  activeTaskId: null,
};

export const boardReducer = (
  state: BoardState,
  action: BoardAction,
): BoardState => {
  switch (action.type) {
    case "SET_COLUMNS":
      return { ...state, columns: action.payload };

    case "ADD_COLUMN":
      return {
        ...state,
        columns: [...state.columns, { ...action.payload, tasks: [] }],
      };

    case "UPDATE_COLUMN":
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.payload.id
            ? { ...col, name: action.payload.name }
            : col,
        ),
      };

    case "DELETE_COLUMN":
      return {
        ...state,
        columns: state.columns.filter((col) => col.id !== action.payload),
      };

    case "REORDER_COLUMNS":
      return {
        ...state,
        columns: action.payload.map((col) => ({
          ...col,
          tasks: state.columns.find((c) => c.id === col.id)?.tasks || [],
        })),
      };

    case "ADD_TASK":
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.payload.columnId
            ? { ...col, tasks: [...col.tasks, action.payload.task] }
            : col,
        ),
      };

    case "UPDATE_TASK":
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.payload.columnId
            ? {
                ...col,
                tasks: col.tasks.map((t) =>
                  t.id === action.payload.task.id ? action.payload.task : t,
                ),
              }
            : col,
        ),
      };

    case "DELETE_TASK":
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.payload.columnId
            ? {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== action.payload.taskId),
              }
            : col,
        ),
      };

    case "REORDER_TASKS":
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.payload.columnId
            ? { ...col, tasks: action.payload.tasks }
            : col,
        ),
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_ADDING":
      return { ...state, adding: action.payload };

    case "SET_NEW_COLUMN_NAME":
      return { ...state, newColumnName: action.payload };

    case "SET_ACTIVE_TASK":
      return { ...state, activeTaskId: action.payload };

    default:
      return state;
  }
};
