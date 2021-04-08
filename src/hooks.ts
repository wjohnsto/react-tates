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

/**
 * Options used to create hooks around a tate object
 *
 * @export
 * @interface StateHookOptions
 * @template T The type of the state value at the specified property
 * @template S The type of the tate object obtained from tates
 * @template ActionFn The type of the action function to invoke when the hook is called
 */
export interface StateHookOptions<
  T,
  S extends State<any>,
  ActionFn extends (...args: any[]) => any
> {
  /**
   * This is the object obtained from calling tates, also known as the "tate"
   *
   * @type {S}
   * @memberof StateHookOptions
   */
  tate: S;

  /**
   * The property path on tate.state to watch for changes
   *
   * @type {string}
   * @memberof StateHookOptions
   */
  property: string;

  /**
   * The action to invoke when the returned hook is initially called
   *
   * @type {ActionFn}
   * @memberof StateHookOptions
   */
  action?: ActionFn;

  /**
   * The initial value to return before a value exists. Defaults to null
   *
   * @type {(T | null)}
   * @memberof StateHookOptions
   */
  initialValue?: T | null;
}

/**
 * The options you pass into the hook function. Allows you to specify arguments
 * to send to the configured action function for the hook. Also lets you prevent the
 * action function from being invoked.
 *
 * @export
 * @interface HookOptions
 * @template ActionFn The action function signature
 */
export interface HookOptions<ActionFn extends (...args: any[]) => any> {
  /**
   * Defaults to true. Pass in false if you do not want to implicitly invoke the action when the hook is
   * called
   *
   * @type {boolean}
   * @memberof HookOptions
   */
  invokeAction?: boolean;

  /**
   * A tuple of parameters to send to the action function configured for the hook. If the hook is typed
   * properly you should be able to tell exactly what parameters you need to send in.
   *
   * @type {ActionParameters}
   * @memberof HookOptions
   */
  actionArgs?: Parameters<ActionFn>;
}

/**
 * HookOptions with an additional key value that will kick-off the state listener once it exists.
 *
 * @export
 * @interface KeyedHookOptions
 * @extends {HookOptions<ActionFn>}
 * @template ActionFn
 */
export interface KeyedHookOptions<ActionFn extends (...args: any[]) => any>
  extends HookOptions<ActionFn> {
  /**
   * You can freely call the keyed hook and pass in undefined as the key. The hook will not do anything until
   * the value of key is a string or a number. When the value exists, the hook will invoke the action function
   * and listen for state changes for the specific key.
   *
   * @type {(string | number)}
   * @memberof KeyedHookOptions
   */
  key?: string | number;
}

/**
 * Creates a React hook that watches for a property on state and calls setState with the value.
 * Returns the React hook that will invoke the action function and listen for state changes when
 * called.
 *
 * @export
 * @template T The type of the state value at the specified property
 * @template S The type of the tate object obtained from tates
 * @template ActionFn The type of the action function to invoke when the hook is called
 * @param {StateHookOptions<T, S, ActionFn>}
 * @returns {(options?: HookOptions<ActionFn>) => T | null}
 */
export function createStateHook<
  T,
  S extends State<any>,
  ActionFn extends (...args: any[]) => any
>({
  tate,
  action,
  property,
  initialValue,
}: StateHookOptions<T, S, ActionFn>): (
  options?: HookOptions<ActionFn>,
) => T | null {
  let initialValueCopy = initialValue;
  const actionFn: ActionFn = isFunction(action) ? action : (noop as any);

  return ({
    invokeAction = true,
    actionArgs,
  }: HookOptions<ActionFn> = {}): T | null => {
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
 * Creates a React hook that watches for a property on state and calls setState with the value.
 * Returns the React hook that will invoke the action function and listen for state changes when
 * called. The returned hook expects a "key" to be passed in that will trigger invoking the action
 * function and listening for state changes. Until the "key" contains a value, the React hook can be
 * invoked as many times as you want and will not start listening.
 *
 * @export
 * @template T The type of the state value at the specified property
 * @template S The type of the tate object obtained from tates
 * @template ActionFn The type of the action function to invoke when the hook is called
 * @param {StateHookOptions<T, S, ActionFn>}
 * @returns {(options?: HookOptions<ActionFn> & { key?: string | number; }) => T | null}
 */
export function createKeyedStateHook<
  T,
  S extends State<any>,
  ActionFn extends (...args: any[]) => any
>({
  tate,
  action,
  property,
  initialValue,
}: StateHookOptions<T, S, ActionFn>): (
  options?: HookOptions<ActionFn> & { key?: string | number },
) => T | null {
  let initialValueCopy = initialValue;
  const actionFn = isFunction(action) ? action : noop;

  return ({
    key,
    invokeAction = true,
    actionArgs,
  }: HookOptions<ActionFn> & {
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
