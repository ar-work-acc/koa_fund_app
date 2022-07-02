import React from "react"
import { Link, useLocation } from "react-router-dom"
import { useGetAccountInfoQuery } from "../api/sliceAPI"
import classNames from "classnames"

/**
 * Get the first part from a location string:
 * "/a/b/c" returns "/a",
 * "/a" returns "/a";
 * otherwise, return an empty string
 */
function getBasePath(path) {
    const firstIndex = path.indexOf("/")
    const secondIndex = path.indexOf("/", firstIndex + 1)
    if (firstIndex !== -1 && secondIndex !== -1) {
        return path.substring(firstIndex, secondIndex)
    } else if (firstIndex !== -1) {
        return path.substring(firstIndex)
    } else {
        return ""
    }
}

export const Sidebar = () => {
    let location = useLocation()
    const basePath = getBasePath(location.pathname)

    const { data: accountInfo, isSuccess } = useGetAccountInfoQuery(null)

    const menuArray = [
        // menu item for every user:
        {
            path: "/funds",
            text: "Funds",
            authorizationNeeded: false,
        },
        {
            path: "/orders",
            text: "Orders",
            authorizationNeeded: false,
        },
        // for managers or admins only:
        {
            path: "/admin",
            text: "Simulate Processing",
            authorizationNeeded: true,
        },
    ]

    const generateMenuItems = (predicate) => {
        return menuArray.filter(predicate).map((item) => {
            const linkClassName = classNames("nav-link", {
                active: item.path === basePath,
            })
            return (
                <li key={item.path} className="nav-item">
                    <Link to={item.path} className={linkClassName}>
                        {item.text}
                    </Link>
                </li>
            )
        })
    }

    let adminSection = ""
    if (isSuccess && accountInfo.isAdmin) {
        adminSection = (
            <React.Fragment>
                <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                    <span>
                        <b>Admin Only Section</b>
                    </span>
                </h6>
                <ul className="nav flex-column mb-2">
                    {generateMenuItems((item) => item.authorizationNeeded)}
                </ul>
            </React.Fragment>
        )
    }

    return (
        <nav
            id="sidebarMenu"
            className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse"
        >
            <div
                className="position-sticky pt-3"
                style={{ marginBottom: "420px" }}
            >
                <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-2 mb-1 text-muted">
                    <span>
                        <b>User Section</b>
                    </span>
                </h6>

                <ul className="nav flex-column">
                    {generateMenuItems((item) => !item.authorizationNeeded)}
                </ul>

                {adminSection}
            </div>
        </nav>
    )
}
