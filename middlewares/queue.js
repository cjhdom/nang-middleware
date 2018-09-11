const axios = require('axios');
const uuid = require('uuid/v4');

exports = module.exports = function (isExit) {
    return function (req, res, next) {
        if (!req.context) {
            req.context = {};
        }
        req.context.startTime = +new Date();

        const originalRender = res.render;
        res.render = function () {
            axios.post('http://localhost:3001/recordtime', {
                url: req.url,
                startTime: req.context.startTime,
                endTime: +new Date()
            }).then(() => originalRender.apply(this, arguments))
                .catch(err => {
                    console.log('recording time api err', err);
                    originalRender.apply(this, arguments);
                });
        };

        const reqUuid = req.cookies.uuid;
        if (isExit) {
            axios.get(`http://localhost:3001/remove/${reqUuid}`)
                .then(() => next())
                .catch(err => next(err));
        } else if (reqUuid) {
            axios.get(`http://localhost:3001/get/${reqUuid}`)
                .then(result => {
                    if (result.data.resultCode === 2) {
                        return axios.get(`http://localhost:3001/update/${reqUuid}`)
                            .then(() => next())
                            .catch(() => next());
                    }

                    axios.get(`http://localhost:3001/insert/${reqUuid}`)
                        .then(res => {
                            console.log(reqUuid, res);
                            if (res.data.resultCode !== 2) {
                                req.context.isWaiting = true;
                            }
                            next();
                        })
                        .catch(err => {
                            next(err);
                        });
                })
                .catch(err => {
                    next(err);
                });
        } else {
            const newUuid = uuid();
            req.cookies.uuid = newUuid;
            res.cookie('uuid', newUuid);
            // 켜져있는지 확인 필요
            axios.get(`http://localhost:3001/insert/${newUuid}`)
                .then(res => {
                    if (res.data.resultCode !== 2) {
                        req.context.isWaiting = true;
                    }
                    next();
                })
                .catch(err => {
                    next(err);
                });
        }
    };
};