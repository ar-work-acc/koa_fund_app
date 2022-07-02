import React, { useState } from "react"
import { Routes, Route } from "react-router-dom"
import "./App.css"
import { useGetAccountInfoQuery } from "./features/api/sliceAPI"
import { LoginForm } from "./features/login/LoginForm"
import { TopNavbar } from "./features/common/TopNavbar"
import { Sidebar } from "./features/common/Sidebar"
import { WelcomePage } from "./features/common/WelcomePage"
import { FundList } from "./features/fund/FundList"
import { FundDetail } from "./features/fund/FundDetail"
import { AdminPanel } from "./features/admin/AdminPanel"
import { Orders } from "./features/fund/Orders"

function App() {
    const [jwt, setJwt] = useState(null)

    const { data: account, isSuccess: getUserAccountSuccess } =
        useGetAccountInfoQuery(null, { skip: jwt === null })

    if (getUserAccountSuccess && account?.id) {
        return (
            <React.Fragment>
                <TopNavbar setJwt={setJwt} />
                <div className="container-fluid">
                    <div className="row">
                        <Sidebar />
                        <Routes>
                            <Route path="/" exact element={<WelcomePage />} />
                            <Route path="/funds" exact element={<FundList />} />
                            <Route path="/funds/:id" element={<FundDetail />} />
                            <Route path="/orders" exact element={<Orders />} />
                            <Route
                                path="/admin"
                                exact
                                element={<AdminPanel />}
                            />
                        </Routes>
                    </div>
                </div>
            </React.Fragment>
        )
    } else {
        return (
            <main className="container mt-5">
                <LoginForm setJwt={setJwt} />
            </main>
        )
    }
}

export default App
