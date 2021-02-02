const router = require("express").Router();

const verify = require("./verifyToken");

router.use(verify)
router.get('/',(req,res)=>{

    res.send("Inside Crm");

})

module.exports = router;
