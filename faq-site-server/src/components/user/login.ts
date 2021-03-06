import crypto from "crypto";
import {Request, Response} from "express";

import {app, logger} from "../../index";
import {Settings} from "../../settings";
import {DatabaseResultSet, query} from "../../database-connection";

import {LoginRequest, LoginRequestCallBack, LoginResponses} from "../../../../faq-site-shared/api-calls/index";
import {IUser} from "../../../../faq-site-shared/models/IUser";

import {secretKey} from "../../auth/jwt-key";
import {sign} from "../../auth/jwt";
import {customValidator} from "../../utilities/string-utils";

app.post(LoginRequest.getURL, (req: Request, res: Response) => {

    const loginRequest: LoginRequest = req.body as LoginRequest;

    // Checking the input, see createaccount for a (bit) more in depth explanation
    if (customValidator({
        input: loginRequest.password,
        validationObject: {
            length: 8
        }
    }).valid && customValidator({input: loginRequest.email}).valid) {

        // If the input is actually valid, check if the password entered is equal. Depending on the output of the server, provide the correct error or login.
        crypto.pbkdf2(loginRequest.password, secretKey, Settings.PASSWORDITERATIONS, 64, "sha512", (err: Error | null, derivedKey: Buffer) => {

            query(`
                SELECT email, id, firstname, lastname, admin, blocked, verified, password, avatar
                FROM users
                WHERE email = ?
                `, loginRequest.email)
                    .then((result: DatabaseResultSet) => {

                        if (result.getRows().length === 0) {
                            res.json(new LoginRequestCallBack(LoginResponses.NOEXISTINGACCOUNT));
                        } else if (result.getStringFromDB("password") === derivedKey.toString("hex")) {

                            if (result.getNumberFromDB("blocked") === 1) {
                                res.json(new LoginRequestCallBack(LoginResponses.ACCOUNTBLOCKED));
                            } else if (result.getNumberFromDB("verified") === 0) {
                                res.json(new LoginRequestCallBack(LoginResponses.ACCOUNTNOTVERIFIED));
                            } else {

                                const userModel: IUser = {
                                    id: result.getNumberFromDB("id"),
                                    email: result.getStringFromDB("email"),
                                    admin: result.getNumberFromDB("admin") === 1,
                                    blocked: result.getNumberFromDB("blocked"),
                                    verified: result.getNumberFromDB("verified"),
                                    firstname: result.getStringFromDB("firstname"),
                                    lastname: result.getStringFromDB("lastname"),
                                    avatar: result.getStringFromDB("avatar")
                                };

                                const jwt = sign(userModel);

                                // Sign a JWT token which has the usermodel, on this way, we don't have to check in the database when we get a request from the user, we just verify the JWT token, which contains the userModel.
                                // Also, the token is only valid for 2 hours (7200000)
                                res.cookie("token", jwt, {
                                    maxAge: Settings.TOKENAGEMILLISECONDS
                                });

                                res.json(new LoginRequestCallBack(LoginResponses.SUCCESS, userModel));
                            }

                        } else {
                            res.json(new LoginRequestCallBack(LoginResponses.INCORRECTPASS));
                        }

                    })
                    .catch(err => {
                        logger.error(`Login query failed: ${err}`);
                        logger.error(err);
                        res.status(500).send();
                    });

        });
    } else {
        res.json(new LoginRequestCallBack(LoginResponses.INVALIDINPUT));
    }


});
