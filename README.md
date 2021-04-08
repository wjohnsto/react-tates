# react-tates

A state management library for React that uses [tates](https://github.com/wjohnsto/tates)

The **primary objective** of this library is to provide helper methods for creating hooks around a [tates](https://github.com/wjohnsto/tates) object.

# Table of Contents

- [Current Status](#current-status)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Notification Example](#notification-example)
  - [API Service Example](#api-service-example)
- [Functions](#functions)
- [How can I Contribute](#how-can-i-contribute)
  - [Test](#test)
  - [Make a Pull Request](#make-a-pull-request)

# Current Status

This project is active and maintained. Feel free to submit issues and PRs!

- Most recent build is linted according to .eslintrc.js

# Installation

Using npm:

```shell
npm i react-tates
```

> NOTE: add `-S` if you are using npm < 5.0.0

Using yarn:

```shell
yarn add react-tates
```

# Getting Started

The recommended way to use `react-tates` is by following an `actor` pattern and using `tates` as an observable state object.

## Notification Example
Consider the following example of using tates to create a global `notification` actor:

```ts
import tates from 'tates';
import { createStateHook } from 'react-tates';

export interface Notification {
  text: string | string[] | ArrayLike<string>;
  label?: string;
  severity?: 'warning' | 'danger' | 'success' | 'info';
}

export interface NotificationState {
  notification: Notification | null;
}

const tate = tates<NotificationState>();
const { state } = tate;

export const actions = {
  notify(notification: Notification | null = null) {
    state.notification = notification;
  },

  handleError(e: unknown) {
    console.error(e);
    let errorMessage: ArrayLike<string> = 'Unknown error ocurred';
    if (utils.isErrorLike(e)) {
      errorMessage = e.message;
    }

    actions.notify({
      text: errorMessage,
      severity: 'danger',
    });
  },
};

/**
 * Lets you know when there is a new global notification
 */
export const useNotification = utils.createStateHook<
  NotificationObj,
  typeof tate,
  any
>({
  tate,
  property: props.NOTIFICATION,
});
```

The code above will create an actor that allows you to keep a global notification object. This can be useful if you want an alert dialog whenever you want to display a message to your user. In the code above you might have `<Notification />` component that uses the `useNotification` hook that will trigger a rerender anytime the notification is updated.

## API Service Example

Suppose you have an API service that lets you manage products. You might have a service file on your frontend that exposes the following methods:

  - `getProducts`: Gets all the products
  - `getProduct`: Gets a single product
  - `getCart`: Gets the shopping cart for the current user
  - `addProduct`: Adds a product to the cart
  - `removeProduct`: Removes a product from the cart

With `react-tates` you can wrap your Product service with an actor as follows:

```ts
import tates from 'tates';
import { createStateHook } from 'react-tates';
import service, { Products, Product, Cart } from './services';

export interface ProductState {
  product: Product;
  products: Products;
  cart: Cart;
}

const tate = tates<ProductState>();
const { state } = tate;

export const actions = {
  async getProducts() {
    state.products = await service.getProducts();
  },
  async getProduct(uid: string) {
    state.product = await service.getProduct(uid);
  },
  async getCart() {
    state.cart = await service.getCheckout();
  },
  async addProduct(uid: string) {
    await service.addProduct(uid);
    void actions.getCart();
  },
  async removeProduct(uid: string) {
    await service.removeProduct(uid);
    void actions.getCart();
  },
};

export const useProduct = createStateHook<
  Product,
  typeof tate,
  typeof actions.getProduct
>({
  tate,
  action: actions.getProduct,
  property: 'product',
});

export const useProducts = createStateHook<
  Products,
  typeof tate,
  typeof actions.getProducts
>({
  tate,
  action: actions.getProducts,
  property: 'products',
});

export const useCart = createStateHook<
  Cart,
  typeof tate,
  typeof actions.getCart
>({
  tate,
  action: actions.getCart,
  property: 'cart',
});
```

The above code publishes three hooks: `useProduct`, `useProducts`, and `useCart`. You can use these hooks in your React components to get updates when the associated state values change. Note that the `addProduct` and `removeProduct` actions will in turn retrieve an updated cart. This will end up rerendering any component that relies on `useCart`. Note that `useProduct` is tied to the `getProduct` action. You need to pass arguments into the `acitons.getProduct` in order to fetch the correct product from your store. A call to `useProduct` would be as follows:

```ts
useProduct({
  actionArgs: ['my-product-uid']
});
```

> **NOTE**: When you call `createStateHook` you pass in the action that will be invoked by default when you call the hook. Sometimes it is not necessary to invoke the action function. If you don't want to invoke the action function you can pass `invokeAction: false` as an option to the hook function.

# Functions

`react-tates` publishes two functions: `createStateHook` and `createKeyedStateHook`. These functions work almost the same, with one "key" difference:

- `createStateHook`
  - Creates a React hook that watches for a property on state and calls setState with the value.
  - Returns the React hook that will invoke the action function and listen for state changes when called.
- `createKeyedStateHook`
  - Creates a React hook that watches for a property on state and calls setState with the value.
  - Returns the React hook that will invoke the action function and listen for state changes when called.
  - The returned hook expects a "key" to be passed in that will trigger invoking the action function and listening for state changes.
  - Until the "key" contains a value, the React hook can be invoked as many times as you want and will not start listening.

# How can I Contribute?

tates is open to contributions that improve the core functionality of the library while sticking to the primary objective listed above.

## Test

Before you share your improvement with the world, make sure you add tests to validate your contribution. Testing is done using `jest`.

## Make A Pull Request

Once you've tested your contribution, submit a pull request. Make sure to [squash your commits](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History#_squashing) first!.
