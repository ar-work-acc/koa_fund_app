import React from "react"
import { useGetAccountInfoQuery } from "../api/sliceAPI"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { sliceAPI } from "../api/sliceAPI"
import { useDispatch } from "react-redux"

export const TopNavbar = ({ setJwt }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const onLogout = async (e) => {
        e.preventDefault()
        // just remove the JWT token to log out:
        localStorage.removeItem("jwt")
        setJwt(localStorage.getItem("jwt"))

        // remove all existing cache entries
        dispatch(sliceAPI.util.resetApiState())

        navigate(`/`, { replace: true })
    }

    const { data: account, isSuccess } = useGetAccountInfoQuery(null)

    let welcomeMessage = <span></span>
    let title = ""
    if (isSuccess) {
        switch (account.isAdmin) {
            case true:
                title = "administrator"
                break
            case false:
                title = "user"
                break
            default:
                title = "guest"
        }

        welcomeMessage = (
            <span>
                Welcome <b>{title}</b>:{" "}
                {`${account.firstName} ${account.lastName};`}{" "}
                <b>your balance</b>:{" "}
                {`${parseFloat(account.balance).toFixed(2) / 1}`}
                {account.isAgreementSigned ? "(agreement signed)" : ""}
            </span>
        )
    }

    return (
        <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
            <Link to="/" className="navbar-brand col-md-3 col-lg-2 me-0 px-3">
                Mutual Fund App
            </Link>
            <div className="navbar-nav ms-auto me-5">
                <span style={{ color: "white" }}>{welcomeMessage}</span>
            </div>
            <div className="navbar-nav">
                <div className="nav-item text-nowrap">
                    <a className="nav-link px-3" href="/" onClick={onLogout}>
                        Sign out
                    </a>
                </div>
            </div>
        </header>
    )
}
