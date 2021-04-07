/**
 * This file provides helper functions for easily creating state hooks
 */
import { useEffect, useState } from 'react';
import { SubscribeFn } from 'tates';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import isNil from 'lodash/isNil';
import noop from 'lodash/noop';

export interface Tate<State> {
  state: State;
  subscribe: SubscribeFn;
}

/**
 * Given an actor, creates a state hook that watches for a property
 * on state and calls setState with the value
 *
 * @export
 * @param {Tate<State>} actor
 * @returns {(<S>(property: string) => S | null)}
 */
export function createStateHook<State>(
  actor: Tate<State>,
): <S>(property: string) => S | null;
export function createStateHook<T, State>(
  actor: Tate<State>,
  prop: string,
): () => T | null;
export function createStateHook<T, State>(
  actor: Tate<State>,
  prop: string,
  initialValue: T,
): () => T;
export function createStateHook<T = any, State = any>(
  actor: Tate<State>,
  prop?: string,
  initialValue?: T | null,
) {
  let initialValueCopy = initialValue;
  if (!isString(prop)) {
    return <S>(property: string): S | null => {
      return createStateHook<S, State>(actor, property)();
    };
  }

  return (): T | null => {
    if (isUndefined(initialValueCopy)) {
      initialValueCopy = null;
    }

    const [state, setState] = useState<T | null>(initialValueCopy);

    useEffect(() => {
      return actor.subscribe<T>((value) => {
        if (isUndefined(value)) {
          setState(null);
          return;
        }

        setState(value);
      }, prop);
    }, []);

    if (isNil(state) && !isNil(initialValueCopy)) {
      return initialValueCopy;
    }

    return state;
  };
}

/**
 * Same as createStateHook, but expects the caller to send in a string denoting a value to
 * send to an invoker (usually an actor method). Watches state after the method is invoked.
 *
 * @export
 * @template T
 * @param {Tate<State>} actor
 * @param {(uid: string) => void} invoke
 * @param {string} parentProp
 * @returns {((uid?: string) => T | null)}
 */
export function createKeyedStateHook<T = any, State = any>(
  actor: Tate<State>,
  invoke: (uid: string | number) => void,
  parentProp: string,
): (id?: string | number) => T | null {
  return (id?: string | number): T | null => {
    const [state, setState] = useState<T | null>(null);

    useEffect(() => {
      if (isNil(id)) {
        return noop;
      }

      invoke(id);

      return actor.subscribe<T>((value) => {
        if (isUndefined(value)) {
          setState(null);
          return;
        }

        setState(value);
      }, `${parentProp}.${id}`);
    }, [id]);

    return state;
  };
}

/**
 * Similar to createKeyedStateHook, only the subscribe property is already defined
 *
 * @export
 * @template T
 * @param {Tate<State>} actor
 * @param {(id: string) => void} invoke
 * @param {string} prop
 * @returns {((id?: string) => T | null)}
 */
export function createWrappedStateHook<T = any, State = any>(
  actor: Tate<State>,
  invoke: (param?: string | number) => void,
  prop: string,
): (param?: string | number) => T | null {
  return (param?: string | number): T | null => {
    const [state, setState] = useState<T | null>(null);

    useEffect(() => {
      invoke(param);

      return actor.subscribe<T>((value) => {
        if (isUndefined(value)) {
          setState(null);
          return;
        }

        setState(value);
      }, prop);
    }, [param]);

    return state;
  };
}

export type HookCreator = <S>(property: string) => S | null;
export type ScopedHookCreator<T> = () => T | null;
