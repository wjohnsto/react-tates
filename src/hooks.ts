/**
 * This file provides helper functions for easily creating state hooks
 */
import { useEffect, useState } from 'react';
import type { State } from 'tates';
import isUndefined from 'lodash/isUndefined';
import isNil from 'lodash/isNil';
import noop from 'lodash/noop';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

export interface StateHookOptions<T, S extends State<any> = State<any>, ActionFn extends (...args: any[]) => any = (...args: any[]) => any> {
  tate: S;
  property: string;
  action?: ActionFn;
  initialValue?: T | null;
}

export interface HookOptions<ActionParameters = any> {
  invokeAction?: boolean;
  actionArgs?: ActionParameters;
}

/**
 * Given an actor, creates a state hook that watches for a property
 * on state and calls setState with the value
 *
 * @export
 * @param {State} actor
 * @returns {(<S>(property: string) => S | null)}
 */
export function createStateHook<T, S extends State<any> = State<any>, ActionFn extends (...args: any[]) => any = (...args: any[]) => any>({
  tate,
  action,
  property,
  initialValue,
}: StateHookOptions<T, S, ActionFn>) {
  let initialValueCopy = initialValue;
  const actionFn: ActionFn = isFunction(action) ? action : noop as any;

  return ({
    invokeAction = true,
    actionArgs,
  }: HookOptions<Parameters<ActionFn>> = {}): T | null => {
    const actionArr: any[] = isArray(actionArgs) ? actionArgs : [];

    if (isUndefined(initialValueCopy)) {
      initialValueCopy = null;
    }

    const [state, setState] = useState<T | null>(initialValueCopy);

    useEffect(() => {
      if (invokeAction) {
        void actionFn(...actionArr);
      }

      return tate.subscribe<T>((value) => {
        if (isUndefined(value)) {
          setState(null);
          return;
        }

        setState(value);
      }, property);

      /* eslint-disable-next-line react-hooks/exhaustive-deps,@typescript-eslint/no-unsafe-assignment */
    }, [invokeAction, ...actionArr]);

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
export function createKeyedStateHook<T, S extends State<any> = State<any>, ActionFn extends (...args: any[]) => any = (...args: any[]) => any>({
  tate,
  action,
  property,
  initialValue,
}: StateHookOptions<T, S, ActionFn>) {
  let initialValueCopy = initialValue;
  const actionFn = isFunction(action) ? action : noop;

  return ({
    key,
    invokeAction = true,
    actionArgs,
  }: HookOptions<Parameters<ActionFn>> & {
    key?: string | number;
  } = {}): T | null => {
    const [state, setState] = useState<T | null>(null);
    const actionArr: any[] = isArray(actionArgs) ? actionArgs : [];

    useEffect(() => {
      if (isUndefined(initialValueCopy)) {
        initialValueCopy = null;
      }

      if (isNil(key)) {
        return noop;
      }

      if (invokeAction) {
        void actionFn(...actionArr);
      }

      return tate.subscribe<T>((value) => {
        if (isUndefined(value)) {
          setState(null);
          return;
        }

        setState(value);
      }, `${property}.${key}`);
      /* eslint-disable-next-line react-hooks/exhaustive-deps,@typescript-eslint/no-unsafe-assignment */
    }, [key, invokeAction, ...actionArr]);

    if (isNil(state) && !isNil(initialValueCopy)) {
      return initialValueCopy;
    }

    return state;
  };
}
