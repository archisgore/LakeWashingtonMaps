var qs = require('querystring');
var https = require('https');
var Github = require('github-api');

function editRouter() {
    var er = require('express').Router();


    var cookieOpts = {
        httpOnly: true,
        path: "/"
    };

    function authenticate(code, cb) {
        var data = qs.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        });

        var reqOptions = {
            host: 'github.com',
            port: 443,
            path: '/login/oauth/access_token',
            method: 'POST',
            headers: {
                'content-length': data.length
            }
        };

        var body = "";
        var req = https.request(reqOptions, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                cb(null, qs.parse(body).access_token);
            });
        });

        req.write(data);
        req.end();
        req.on('error', function(e) {
            cb(e.message);
        });
    }

    function validateCollaborator(token, login, cb) {
        var gh = new Github({
            token: token
        });

        var dsm_repo = gh.getRepo("archisgore", "dive-site-markers");
        dsm_repo.isCollaborator(login, function(err, isCollaborator) {
            cb(null, isCollaborator, login);
        });
    }

    function validateScopes(scopes) {
        for (var i = 0; i < auth.scopes.length; i++) {
            if (auth.scopes[i] == "repo") {
                return true;
            }
        }
        return false;
    }

    function validateToken(token, cb) {
        if (token == "") {
            cb("Empty token");
            return;
        } else {

            var buf = Buffer.from(process.env.GITHUB_CLIENT_ID + ":" + process.env.GITHUB_CLIENT_SECRET, "ascii");

            var reqOptions = {
                host: 'api.github.com',
                port: 443,
                path: '/applications/' + process.env.GITHUB_CLIENT_ID + '/tokens/' + token,
                method: 'GET',
                headers: {
                    'Authorization': "Basic " + buf.toString('base64'),
                    'User-Agent': 'Node.js http library'
                }
            };

            var body = "";
            var req = https.request(reqOptions, function(res) {
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    body += chunk;
                });
                res.on('end', function() {
                    if (res.statusCode == 200) {
                        var auth = JSON.parse(body);
                        if (!validateScopes) {
                            cb("The current token does not have a required scope 'repo'. Available scopes: " + auth.scopes);
                        } else {
                            validateCollaborator(token, auth.user.login, cb)
                        }
                    } else {
                        cb("An error occurred when validating token: " + res.statusCode);
                    }
                });
            });
            req.end();

            req.on('error', function(e) {
                cb(e.message);
            });
        }
    }

    er.post('/save', function(req, res) {

        var body = [];
        req.on('data', function(chunk) {
            body.push(chunk);
        }).on('end', function() {
            body = Buffer.concat(body).toString();

            var gh = new Github({
                token: req.cookies.GithubAccessToken
            });

            var dsm_repo = gh.getRepo("archisgore", "dive-site-markers");
            dsm_repo.writeFile("master", "markers.json", body, "Markers updated from Web UI", function(err, resp) {
                if (typeof(resp) != "undefined") {
                    res.status(200).end();
                } else if (typeof(err) != "undefined") {
                    res.status(err.status).end("An error occurred when calling Github.");
                }
            });
        });
    });

    er.get('/login_error', function(req, res) {
        res.sendFile("login_error.html", {
            root: "./client"
        });
    });

    er.get('/not_collaborator', function(req, res) {
        res.sendFile("not_collaborator.html", {
            root: "./client"
        });
    });

    er.get('/login', function(req, res) {
        res.sendFile("login.html", {
            root: "./client"
        });
    });


    er.get('/invalid_redirect', function(req, res) {
        res.cookie("GithubAccessToken", "", cookieOpts);
        res.redirect(302, "/edit");
    });

    er.get('/authorize', function(req, res) {
        authenticate(req.query.code, function(err, token) {
            var result = err || !token ? {
                "error": "bad_code"
            } : {
                "token": token
            };

            if (token) {
                res.cookie("GithubAccessToken", token, cookieOpts);
                res.redirect(302, "/edit");
            } else {
                res.cookie("GithubAccessToken", "", cookieOpts);
                res.redirect(302, "/edit/login_error");
            }
        });
    });

    er.get('/', function(req, res) {
        if (typeof(req.cookies.GithubAccessToken) == "undefined") {
            res.redirect(302, "/edit/login");
        } else {
            validateToken(req.cookies.GithubAccessToken, function(err, isCollaborator, login) {
                if (err) {
                    res.redirect(302, "https://github.com/login/oauth/authorize?scope=repo&client_id=" + process.env.GITHUB_CLIENT_ID);
                } else if (!isCollaborator) {
                    res.redirect(302, "/edit/not_collaborator#" + login);
                } else {
                    res.sendFile("edit.html", {
                        root: "./client"
                    });
                }
            });
        }
    });

    return er;
}


module.exports = {
    editRouter: editRouter
}