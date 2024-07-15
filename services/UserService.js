import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import user from '../dist/db/models/user.js';
// GET api/v1/users/findUsers que devuelva una lista filtrada de usuarios que
// cumplan con cualquiera de los siguientes parámetros
// - eliminados (true or false)
// - Coincidan parcial o totalmente con el nombre
// - Hayan iniciado sesión antes de una fecha especificada
// - Hayan iniciado sesión después de una fecha especificada
// (Obs: usar los parámetros del request, QueryParams como filtros)

const validateUser = (user) => {
    const { name, password, email, cellphone } = user;
    if (!name || !password || !email || !cellphone) {
        console.log("Error con validacion de usuario")
        return false;
    }
    return true;
};

const bulkCreateUsers = async (users) => {
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
        if (validateUser(user)) {
            try {
                const userExist = await db.User.findOne({
                    where: {
                        email: user.email
                    }
                });
                if (userExist) {
                    console.log("Encontramos a uno creado")
                    failureCount++;
                    continue
                }
            
                const encryptedPassword = await bcrypt.hash(user.password, 10);
                const newUser = await db.User.create({
                    name: user.name,
                    email: user.email,
                    password: encryptedPassword,
                    cellphone: user.cellphone,
                    status: true
                });
                if(newUser){
                    successCount++;
                }
            } catch (error) {
                console.error('Error creating user:', error);
                failureCount++;
            }
        } else {
            console.log("error con validacion")
            failureCount++;
        }
    }

    return { successCount, failureCount };
};

const findUsers = async (req) => {
    const {
        name,
        deleted,
        loginBefore,
        loginAfter
    } = req.query; // Usamos req.params en vez de req.query

    const users = await db.User.findAll({
        where: {
            name: {
                [Op.like]: `%${name}%`
            },
            status: deleted === 'true' ? false : true
        }
    });
    
    if (!loginBefore && !loginAfter) {
        return {
            code: 200,
            message: users};
    }
    const filteredUsers = await Promise.all(users.map(async (user) => {
        const sessions = await db.Session.findAll({
            where: {
                id_user: user.id,
                createdAt: {
                    [Op.lte]: new Date(loginBefore),
                    [Op.gte]: new Date(loginAfter)
                }
            }
        });

        // Retornar el usuario si tiene al menos una sesión en el rango de fechas
        return sessions.length > 0 ? user : null;
    }));

    // Filtrar resultados nulos
    const validUsers = filteredUsers.filter(user => user !== null);


    
    return {
        code: 200,
        message: validUsers
    };
};

const createUser = async (req) => {
    const {
        name,
        email,
        password,
        password_second,
        cellphone
    } = req.body;
    if (password !== password_second) {
        return {
            code: 400,
            message: 'Passwords do not match'
        };
    }
    const user = await db.User.findOne({
        where: {
            email: email
        }
    });
    if (user) {
        return {
            code: 400,
            message: 'User already exists'
        };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true
    });
    return {
        code: 200,
        message: 'User created successfully with ID: ' + newUser.id,
    }
};

const getUserById = async (id) => {
    return {
        code: 200,
        message: await db.User.findOne({
            where: {
                id: id,
                status: true,
            }
        })
    };
}

const updateUser = async (req) => {
    const user = db.User.findOne({
        where: {
            id: req.params.id,
            status: true,
        }
    });
    const payload = {};
    payload.name = req.body.name ?? user.name;
    payload.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
    payload.cellphone = req.body.cellphone ?? user.cellphone;
    await db.User.update(payload, {
        where: {
            id: req.params.id
        }

    });
    return {
        code: 200,
        message: 'User updated successfully'
    };
}

const deleteUser = async (id) => {
    /* await db.User.destroy({
        where: {
            id: id
        }
    }); */
    const user = db.User.findOne({
        where: {
            id: id,
            status: true,
        }
    });
    await  db.User.update({
        status: false
    }, {
        where: {
            id: id
        }
    });
    return {
        code: 200,
        message: 'User deleted successfully'
    };
}

const getActiveUsers = async () => {
    return {
        code: 200,
        message: await db.User.findAll({
            where: {
                status: true
            }
        })
    };
}
export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getActiveUsers,
    findUsers,
    bulkCreateUsers
}