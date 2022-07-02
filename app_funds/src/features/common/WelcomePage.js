export const WelcomePage = () => {
    return (
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Welcome to our funds demo app!</h1>
                <div className="btn-toolbar mb-2 mb-md-0">
                    <div className="btn-group me-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                                window.open("https://github.com/meowfishorg")
                            }
                        >
                            GitHub
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-5 mb-4 bg-light rounded-3">
                <div className="container-fluid py-5">
                    <h5 className="display-6 fw-bold">
                        What we should see in this project:
                    </h5>
                    <div className="col-md-8 fs-4">
                        <ol>
                            <li>Can you learn new things? e.g., Koa.js</li>
                            <li>
                                How you design and arrage your backend code and
                                APIs.
                            </li>
                            <li>
                                How you design your database schema
                                (normalization vs. non-normalization) and why?
                            </li>
                            <li>Usage of RDBMS transactions.</li>
                            <li>
                                Containerization (Docker).
                            </li>
                            <li> Sequence diagrams.</li>
                            <li> Unit tests (should describe your use cases).</li>
                            <li>Queue for processing/scheduling costly tasks.</li>
                            <li>
                                Other stuff: TypeScript (strict types eliminates
                                the possibility of a lot of bugs)
                            </li>
                        </ol>
                    </div>
                    <a href="mailto:meowfish.org@gmail.com">
                        <button
                            className="btn btn-primary btn-lg"
                            type="button"
                        >
                            Contact us
                        </button>
                    </a>
                </div>
            </div>
        </main>
    )
}
