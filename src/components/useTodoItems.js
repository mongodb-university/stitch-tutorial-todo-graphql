import React from "react";
import { useLazyQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

const todoReducer = (state, { type, payload }) => {
  switch (type) {
    case "setTodos": {
      return {
        ...state,
        hasHadTodos: payload.length > 0,
        todos: payload || [],
      };
    }
    case "addTodo": {
      const newTodo = {
        ...payload,
        checked: typeof payload.checked === "boolean" ? payload.checked : false,
      };
      return {
        ...state,
        hasHadTodos: true,
        todos: [...state.todos, newTodo],
      };
    }
    case "removeTodo": {
      const removeSpecifiedTodo = todo => todo.id !== payload.id;
      return {
        ...state,
        todos: state.todos.filter(removeSpecifiedTodo),
      };
    }
    case "clearCompletedTodos": {
      const isNotCompleted = todo => todo.checked !== true;
      return {
        ...state,
        todos: state.todos.filter(isNotCompleted),
      };
    }
    case "clearTodos": {
      return { ...state, todos: [] };
    }
    case "setTodoStatus": {    
      const updateTodoStatus = todo => {
        const isThisTodo = todo._id === payload.id;
        return isThisTodo ? { ...todo, status: payload.status } : todo;
      };
      return {
        ...state,
        todos: state.todos.map(updateTodoStatus),
      };
    }
    case "completeAllTodos": {
      return {
        ...state,
        todos: state.todos.map(todo => ({ ...todo, checked: true })),
      };
    }
    case "toggleTodoStatus": {
      const updateStatus = todo => {
        const isThisTodo = todo._id === payload.id;
        return isThisTodo ? { ...todo, checked: !todo.checked } : todo;
      };
      return {
        ...state,
        todos: state.todos.map(updateStatus),
      };
    }
    default: {
      console.error(`Received invalid todo action type: ${type}`);
    }
  }
};

export function useTodoItems(userId) {
  const [state, dispatch] = React.useReducer(todoReducer, { todos: [] });
  // Todo Actions
  const FIND_ALL = gql`
    query {
      items(limit: 1000) {
        _id
        checked
        owner_id
        task
      }
    }
  `;
  const [loadTodos, { data: loadData } ] = useLazyQuery(FIND_ALL);

  const ADD_ONE = gql`
    mutation($data: ItemInsertInput!) {
      insertOneItem(data: $data) {
        _id
      }
    }
  `;
  const [addOne] = useMutation(ADD_ONE);
  const addTodo = async task => {
    const { data } = await addOne(
      {
        variables: {
          "data": {
            "task": task,
            "owner_id": userId
          }
        }
      }
    );
    const todo = { task, owner_id: userId };
    dispatch({ type: "addTodo", payload: { ...todo, _id: data.insertOneItem._id } });
  };

  const DELETE_ONE = gql`
    mutation($query: ItemQueryInput!) {
      deleteOneItem(query: $query) {
        _id
      }
    }
  `;
  const [deleteOne] = useMutation(DELETE_ONE);
  const removeTodo = async todoId => {
    await deleteOne(
      {
        variables: {
          "data": {
            "_id": todoId,
            "owner_id": userId
          }
        }
      }
    );
    dispatch({ type: "removeTodo", payload: { id: todoId } });
  };

  const DELETE_ALL = gql`
    mutation {
      deleteManyItems {
        deletedCount
      }
    }
  `;
  const [deleteAll] = useMutation(DELETE_ALL);
  const clearTodos = async () => {
    await deleteAll();
    dispatch({ type: "clearTodos" });
  };

  const DELETE_COMPLETED = gql`
    mutation($query:ItemQueryInput) {
      deleteManyItems(query: $query) {
        deletedCount
      }
    }
  `;
  const [deleteCompleted] = useMutation(DELETE_COMPLETED);
  const clearCompletedTodos = async () => {
    await deleteCompleted(
      {
        variables: {
          "query": {
            "checked": true,
            "owner_id": userId
          }
        }
      }
    );
    dispatch({ type: "clearCompletedTodos" });
  };

  const SET_STATUS = gql`
    mutation($query: ItemQueryInput!, $set: ItemUpdateInput!) {
      updateOneItem(query: $query, set: $set) {
        _id
      }
    }
  `;
  const [setStatus] = useMutation(SET_STATUS);
  const setTodoCompletionStatus = async (todoId, status) => {
    await setStatus(
      { 
        variables: {
          "query": { "_id": todoId, "owner_id": userId },
          "set": { "checked": status }
        }
      }
    );
    dispatch({ type: "setTodoStatus", payload: { todoId, status } });
  };

  const COMPLETE_ALL = gql`
    mutation($query: ItemQueryInput, $set: ItemUpdateInput!) {
      updateManyItems(query: $query, set: $set) {
        modifiedCount
      }
    }
  `;
  const [completeAll] = useMutation(COMPLETE_ALL);
  const completeAllTodos = async () => {
    await completeAll(
      { 
        variables: {
          "query": { "owner_id": userId },
          "set": { "checked": true }
        }
      }
    );
    dispatch({ type: "completeAllTodos" });
  };

  const FIND_TODO = gql`
    query($query: ItemQueryInput!) {
      item(query: $query) {
        checked
        _id
        task
      }
    }
  `;
  const [findTodo, { data: toggleData }]
    = useLazyQuery(FIND_TODO, { fetchPolicy: "network-only"});
  const TOGGLE_TODO = gql`
    mutation($query: ItemQueryInput, $set: ItemUpdateInput!) {
      updateOneItem(query: $query, set: $set) {
        task
        checked
      }
    }
  `;
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const toggleTodoStatus = async todoId => {
    findTodo({ variables: { "query": { "_id": todoId } } });
  };

  const setTodoStatus = async () => {
    await toggleTodo(
      {
        variables: {
          "query": { "_id": toggleData.item._id, "owner_id": userId },
          "set": { "checked": !(toggleData.item.checked) }
        }
      }
    );
    dispatch({ type: "toggleTodoStatus", payload: { id: toggleData.item._id } });
  };

  React.useEffect(() => {
    if (toggleData) {
      setTodoStatus();
    }
  }, [toggleData]);

  React.useEffect(() => {
    if (loadData) {
      dispatch({ type: "setTodos", payload: loadData.items });
    }
  }, [loadData]);

  React.useEffect(() => {
    loadTodos({ variables: { "owner_id": userId } });
  }, []);

  return {
    items: state.todos,
    hasHadTodos: state.hasHadTodos,
    actions: {
      addTodo,
      removeTodo,
      setTodoCompletionStatus,
      clearTodos,
      clearCompletedTodos,
      completeAllTodos,
      toggleTodoStatus,
    },
  };
}
