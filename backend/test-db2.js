const con = require('./models/db');
con.query("SELECT user_name FROM users", (err, res) => {
    if (err) console.error(err);
    console.log(res);
    process.exit();
});
