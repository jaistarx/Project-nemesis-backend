const { userModel } = require("./userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const key=process.env.KEY

const getAllUserDetails = async (req, res) => {
    try {
        const authUserDetails = await verifyUser(req.token);
    } catch (error) {
        return res.status(403).json(error);
    }
    try {
        const userDetails = await userModel.find({}, { password: 0 });
        return res.status(200).send(userDetails);
    } catch (error) {
        return res
            .status(500)
            .send({ message: "Not able to get the Details of all users", error });
    }
};

const insertIntoDatabase = async (body) => {
    const { name, email, address, password } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise(async (resolve, reject) => {
        try {
            const newUser = new userModel({
                name,
                email,
                address,
                password: hashedPassword,
            });
            const newUserDetails = await newUser.save();
            const user = {
                name: newUserDetails.name,
                id: newUserDetails._id,
                email: newUserDetails.email,
                address: newUserDetails.address,
            };
            const token = await jwt.sign({ user },key,{expiresIn:300});
            resolve({ user, token });
        } catch (error) {
            reject({ message: "Email already exist" });
        }
    });
};

const editUserDetails = async (req, res) => {
    try {
        const authUserDetails = await verifyUser(req.token);
    } catch (error) {
        return res.status(403).json(error);
    }
    const { name, address } = req.body;
    const { userId } = req.params;
    try {
        const updatedDetails = await userModel.updateOne(
            { _id: userId },
            { name, address }
        );
        return res.status(200).json({ updatedDetails });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Unable to modify the details", error });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await userModel.find({ email });
        const result = await bcrypt.compare(password, userData[0].password);
        if (result) {
            const userDetails={
                name:userData[0].name,
                id:userData[0]._id,
                email:userData[0].email,
                address:userData[0].address

            }
            const token = await jwt.sign({ userDetails},key,{expiresIn:300});
            return res
                .status(200)
                .json({ message: "login successful", status: true, token, userData });
        } else {
            return res.status(403).json({
                message: "Invalid username or password",
                status: false,
                error,
            });
        }
    } catch (error) {
        return res
            .status(403)
            .json({ message: "User not found", status: false, error });
    }
};

const signUp = async (req, res) => {
    try {
        const response = await insertIntoDatabase(req.body);
        return res
            .status(200)
            .json({ response, message: "signup successful", status: true });
    } catch (error) {
        return res.status(500).json({ message: "The user not created", error });
    }
};
const deleteUser = async (req, res) => {
    try {
        const authUserDetails = await verifyUser(req.token);
    } catch (error) {
        return res.status(403).json(error);
    }
    try {
        const { userId } = req.params;
        await userModel.deleteOne({ _id: userId });
        return res.status(200).json({ message: "Deleted the user" });
    } catch (error) {
        return res.status(500).json({ message: "Not able to delete the user" });
    }
};

const verifyToken = (req, res, next) => {
    const clienttoken = req.headers["authorization"];
    // console.log(clienttoken)
    if (typeof clienttoken !== "undefined") {
        req.token = clienttoken.split(" ")[1];
        next();
    } else {
        return res
            .status(403)
            .json({ message: "You are not authorized to do this operation" });
    }
};

const verifyUser = (token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const authUserDetails = await jwt.verify(token,key,{ignoreExpiration:false});
            resolve(authUserDetails);
        } catch (error) {
            reject({ message: "You are not authorized to do this operation" });
        }
    });
};

module.exports = {
    signUp,
    editUserDetails,
    getAllUserDetails,
    deleteUser,
    login,
    verifyToken,
};
