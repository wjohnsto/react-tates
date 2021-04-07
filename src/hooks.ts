/**
 * This file provides helper functions for easily creating state hooks
 */
import { useEffect, useState } from 'react';
import type { State } from 'tates';
import isUndefined from 'lodash/isUndefined';
import isNil from 'lodash/isNil';
import noop from 'lodash/noop';
import isFunction from 'lodash/isFunction';

export interface StateHookOptions<T, S> {
  tate: State<S>;
  property: string;
  action?: (...args: any[]) => void | Promise<void> | Promise<any>;
  initialValue?: T | null;
}

/**
 * Given an actor, creates a state hook that watches for a property
 * on state and calls setState with the value
 *
 * @export
 * @param {State} actor
 * @returns {(<S>(property: string) => S | null)}
 */
export function createStateHook<T = unknown, S = unknown>({
  tate,
  action,
  property,
  initialValue,
}: StateHookOptions<T, S>) {
  let initialValueCopy = initialValue;
  const actionFn = isFunction(action) ? action : noop;

  return (
    invokeAction = true,
    ...actionArgs: Parameters<typeof actionFn>[]
  ): T | null => {
    if (isUndefined(initialValueCopy)) {
      initialValueCopy = null;
    }

    const [state, setState] = useState<T | null>(initialValueCopy);

    useEffect(() => {
      if (invokeAction) {
        void actionFn(...actionArgs);
      }

      return tate.subscribe<T>((value) => {
        if (isUndefined(value)) {
          setState(null);
          return;
        }

        setState(value);
      }, property);

      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [invokeAction, ...actionArgs]);

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
 * @param {State} actor
 * @param {(uid: string) => void} invoke
 * @param {string} parentProp
 * @returns {((uid?: string) => T | null)}
 */
export function createKeyedStateHook<T = unknown, S = unknown>({
  tate,
  action,
  property,
  initialValue,
}: StateHookOptions<T, S>) {
  let initialValueCopy = initialValue;
  const actionFn = isFunction(action) ? action : noop;

  return (
    key?: string | number,
    invokeAction = true,
    ...actionArgs: Parameters<typeof actionFn>[]
  ): T | null => {
    const [state, setState] = useState<T | null>(null);

    useEffect(() => {
      if (isUndefined(initialValueCopy)) {
        initialValueCopy = null;
      }

      if (isNil(key)) {
        return noop;
      }

      if (invokeAction) {
        void actionFn(...actionArgs);
      }

      return tate.subscribe<T>((value) => {
        if (isUndefined(value)) {
          setState(null);
          return;
        }

        setState(value);
      }, `${property}.${key}`);
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [key, invokeAction, ...actionArgs]);

    if (isNil(state) && !isNil(initialValueCopy)) {
      return initialValueCopy;
    }

    return state;
  };
}
