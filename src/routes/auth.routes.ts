import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  loginValidator,
  registerValidator,
  changePasswordValidator,
  requestResetValidator,
  resetPasswordValidator,
  updateProfileValidator
} from '../validators/auth.validator';

const router = Router();

// Rutas públicas
router.post('/login', loginValidator, authController.login);
//router.post('/register', registerValidator, authController.register);
router.post('/request-reset', requestResetValidator, authController.requestPasswordReset);
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);
router.post('/refresh', authController.refreshToken);

// Rutas protegidas
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, updateProfileValidator, authController.updateProfile);
router.post('/change-password', authMiddleware, changePasswordValidator, authController.changePassword);

export default router;
