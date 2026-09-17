const con = require('./models/db');
con.query("SELECT * FROM users WHERE user_name='natahn27'", (err, res) => {
    if (err) console.error(err);
    console.log(JSON.stringify(res, null, 2));
    process.exit();
});
