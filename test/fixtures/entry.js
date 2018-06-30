module.exports = {
    'GET /api/user': {
        username: 'admin',
        sex: 5
    },
    'GET /repos/hello': (req, res) => {
        return res.json({
            text: 'this is from mock server'
        });
    },
    'GET /api/userinfo/:id': (req, res) => {
        return res.json({
            id: req.params.id,
            username: 'kenny',
        });
    },
    'GET /api/user/list/:id/:type': (req, res) => {
        return res.json({
            id:req.params.id,
            type:req.params.type,
        });
    },

    'POST /api/login/account': (req, res) => {
        const {password, username} = req.body;
        if (password === '888888' && username === 'admin') {
            return res.json({
                status: 'ok',
                code: 0,
                token: "sdfsdfsdfdsf",
                data: {
                    id: 1,
                    username: 'kenny',
                    sex: 6
                }
            });
        } else {
            return res.json({
                status: 'error',
                code: 403
            });
        }
    },
    'DELETE /api/user/:id': (req, res) => {
        res.send({status: 'ok', message: '删除成功！'});
    }
};
;