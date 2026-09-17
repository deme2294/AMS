import React from 'react';
        import { Modal, Button, Form, Row, Col, FormCheck } from 'react-bootstrap'; // Example if using react-bootstrap


        interface AuthenticationModalProps {
            show: boolean;
            handleClose: () => void;
        }

        const AuthenticationModal: React.FC<AuthenticationModalProps> = ({ show, handleClose }) => {

            return (
                <div
                    // ref={modalRef} // Needed if managing instance via useEffect
                    className={`modal fade ${show ? 'show' : ''}`}
                    style={{ display: show ? 'block' : 'none' }} // Basic visibility control
                    id="authentication-modal"
                    tabIndex={-1}
                    role="dialog"
                    aria-labelledby="authentication-modal-label"
                    aria-hidden={!show}
                    aria-modal={show}
                >
                  <div className="modal-dialog mt-6" role="document">
                    <div className="modal-content border-0">
                      <div className="modal-header px-5 position-relative modal-shape-header bg-shape">
                        <div className="position-relative z-1">
                          <h4 className="mb-0 text-white" id="authentication-modal-label">Register</h4>
                          <p className="fs-10 mb-0 text-white">Please create your free Falcon account</p>
                        </div>
                        {/* Ensure theme context is handled if needed for dark mode close button */}
                        <div data-bs-theme="dark">
                            <button
                                type="button"
                                className="btn-close position-absolute top-0 end-0 mt-2 me-2"
                                data-bs-dismiss="modal" // Still useful for Bootstrap JS
                                aria-label="Close"
                                onClick={handleClose} // React way to handle close
                            ></button>
                        </div>
                      </div>
                      <div className="modal-body py-4 px-5">
                        <form>
                          <div className="mb-3">
                            <label className="form-label" htmlFor="modal-auth-name">Name</label>
                            <input className="form-control" type="text" autoComplete="on" id="modal-auth-name" />
                          </div>
                          <div className="mb-3">
                            <label className="form-label" htmlFor="modal-auth-email">Email address</label>
                            <input className="form-control" type="email" autoComplete="on" id="modal-auth-email" />
                          </div>
                          <div className="row gx-2">
                            <div className="mb-3 col-sm-6">
                              <label className="form-label" htmlFor="modal-auth-password">Password</label>
                              <input className="form-control" type="password" autoComplete="on" id="modal-auth-password" />
                            </div>
                            <div className="mb-3 col-sm-6">
                              <label className="form-label" htmlFor="modal-auth-confirm-password">Confirm Password</label>
                              <input className="form-control" type="password" autoComplete="on" id="modal-auth-confirm-password" />
                            </div>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="modal-auth-register-checkbox" />
                            <label className="form-label" htmlFor="modal-auth-register-checkbox">
                              I accept the <a href="#!">terms </a>and <a className="white-space-nowrap" href="#!">privacy policy</a>
                            </label>
                          </div>
                          <div className="mb-3">
                            <button className="btn btn-primary d-block w-100 mt-3" type="submit" name="submit">Register</button>
                          </div>
                        </form>
                        <div className="position-relative mt-5">
                          <hr />
                          <div className="divider-content-center">or register with</div>
                        </div>
                        <div className="row g-2 mt-2">
                          <div className="col-sm-6">
                            <a className="btn btn-outline-google-plus btn-sm d-block w-100" href="#">
                              <span className="fab fa-google-plus-g me-2" data-fa-transform="grow-8"></span> google
                            </a>
                          </div>
                          <div className="col-sm-6">
                            <a className="btn btn-outline-facebook btn-sm d-block w-100" href="#">
                              <span className="fab fa-facebook-square me-2" data-fa-transform="grow-8"></span> facebook
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
        };

        export default AuthenticationModal;