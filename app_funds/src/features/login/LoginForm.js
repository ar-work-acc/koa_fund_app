import React, { useState } from "react"
import { useLoginMutation } from "../api/sliceAPI"

export const LoginForm = ({ setJwt }) => {
    const [userName, setUserName] = useState("")
    const [password, setPassword] = useState("")
    const onUserNameChanged = (e) => setUserName(e.target.value)
    const onPasswordChanged = (e) => setPassword(e.target.value)
    const [login, { data: serverResponse, isLoading, isSuccess, error }] =
        useLoginMutation()
    // if (isSuccess) console.debug(serverResponse)

    const canSave = [userName, password].every(Boolean) && !isLoading
    const onLogin = async (e) => {
        e.preventDefault()
        if (canSave) {
            try {
                const data = await login({
                    username: userName,
                    password,
                }).unwrap()
                localStorage.setItem("jwt", data.token)
                setJwt(localStorage.getItem("jwt"))

                setUserName("")
                setPassword("")
            } catch (err) {
                console.error(
                    `Failed to log in. Reason: ${JSON.stringify(err)}`
                )
            }
        }
    }

    return (
        <div className="row">
            <form className="w-50 mx-auto">
                <h2>{error === undefined ? "" : error.data}</h2>
                <h2 className="mb-4">Mutual Fund App</h2>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                        Account
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        id="username"
                        name="username"
                        aria-describedby="emailHelp"
                        value={userName}
                        onChange={onUserNameChanged}
                    />
                    <div id="emailHelp" className="form-text">
                        Log in with your bank account
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        Password
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        name="password"
                        id="password"
                        autoComplete="on"
                        value={password}
                        onChange={onPasswordChanged}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={onLogin}
                    disabled={!canSave}
                >
                    Submit
                </button>
            </form>
        </div>
    )
}
