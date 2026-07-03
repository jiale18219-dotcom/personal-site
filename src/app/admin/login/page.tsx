"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="admin-login">
      <form action={formAction} className="admin-card">
        <p className="section-head__kicker">admin</p>
        <h1>登录写作后台</h1>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {state.error ? <p className="admin-error">{state.error}</p> : null}
        <button type="submit" disabled={pending}>
          {pending ? "登录中" : "登录"}
        </button>
      </form>
    </main>
  );
}
