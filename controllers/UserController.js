import { Router } from 'express';
import UserService from '../services/UserService.js';
import NumberMiddleware from '../middlewares/number.middleware.js';
import UserMiddleware from '../middlewares/user.middleware.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/bulkCreate',[AuthMiddleware.validateToken], async (req, res) => {
    try {
        const { successCount, failureCount } = await UserService.bulkCreateUsers(req.body.users);
        res.status(200).json({
            "Creados": successCount,
            "Fallos": failureCount
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/findUsers',[AuthMiddleware.validateToken], async (req,res) => {
    const response = await UserService.findUsers(req);
    res.status(response.code).json(response.message);
})

router.get('/getAllUsers', 
    [
        
    ], async (req,res) => {
    const response = await UserService.getActiveUsers();
    res.status(response.code).json(response.message);

})

router.post('/create', async (req, res) => {
    const response = await UserService.createUser(req);
    res.status(response.code).json(response.message);
});


router.get(
    '/:id',
    [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions
    ],
    async (req, res) => {
        const response = await UserService.getUserById(req.params.id);
        res.status(response.code).json(response.message);
    });

router.put('/:id', [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions,
    ],
    async(req, res) => {
        const response = await UserService.updateUser(req);
        res.status(response.code).json(response.message);
    });

router.delete('/:id',
    [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions,
    ],
    async (req, res) => {
       const response = await UserService.deleteUser(req.params.id);
       res.status(response.code).json(response.message);
    });

export default router;