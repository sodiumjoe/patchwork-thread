// Libarary to test
var payload = require('../lib/payload');

// test data
var req = {
    body: {
        payload: '{"before": "5aef35982fb2d34e9d9d4502f6ede1072793222d","repository": {"url": "http://github.com/defunkt/github","name": "github","description": "You\'re lookin\' at it.", "watchers": 5, "forks": 2, "private": 1, "owner": {"email": "chris@ozmm.org","name": "defunkt"}},"commits": [{"id": "41a212ee83ca127e3c8cf465891ab7216a705f59","url": "http://github.com/defunkt/github/commit/41a212ee83ca127e3c8cf465891ab7216a705f59","author": {"email": "chris@ozmm.org","name": "Chris Wanstrath"},"message": "okay i give in","timestamp": "2008-02-15T14:57:17-08:00"},{"id": "de8251ff97ee194a289832576287d6f8ad74e3d0","url": "http://github.com/defunkt/github/commit/de8251ff97ee194a289832576287d6f8ad74e3d0","author": {"email": "chris@ozmm.org","name": "Chris Wanstrath"},"message": "update pricing a tad","timestamp": "2008-02-15T14:36:34-08:00","added": ["filepath.rb"],"removed": ["services/overview.markdown"],"modified": ["test.markdown" ]}], "after": "de8251ff97ee194a289832576287d6f8ad74e3d0","ref": "refs/heads/master"}'
    }
};

exports['test payload.parse'] = function (test) {
    payload.parsePayload(req, function(err, deltaObj){
        test.expect(5);
        if(err){
            console.log(err);
        }else{
            test.equals(deltaObj.repository, 'github');
            test.equals(deltaObj.user, 'defunkt');
            test.equals(deltaObj.updated[0], 'filepath.rb');
            test.equals(deltaObj.updated[1], 'test.markdown');
            test.equals(deltaObj.removed[0], 'services/overview.markdown');
            test.done();
        }
    });
};
