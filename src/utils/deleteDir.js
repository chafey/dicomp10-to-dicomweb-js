const { execSync } = require("child_process");

module.exports = (dir,recursive) => {
    execSync(`rm -rf ${dir}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
    console.log('Delete done')
}