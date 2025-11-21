import { body } from 'express-validator';

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres'),
  body('apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ max: 100 })
    .withMessage('El apellido no puede exceder 100 caracteres'),
  body('dpi')
    .optional()
    .isLength({ min: 13, max: 13 })
    .withMessage('El DPI debe tener 13 dígitos')
    .isNumeric()
    .withMessage('El DPI solo debe contener números'),
  body('telefono')
    .optional()
    .isLength({ max: 15 })
    .withMessage('El teléfono no puede exceder 15 caracteres'),
  body('idRol')
    .isInt({ min: 1 })
    .withMessage('El rol es requerido')
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    })
];

export const requestResetValidator = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail({ gmail_remove_dots: false })
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('El token es requerido'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
];

export const updateProfileValidator = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres'),
  body('apellido')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El apellido no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El apellido no puede exceder 100 caracteres'),
  body('telefono')
    .optional()
    .isLength({ max: 15 })
    .withMessage('El teléfono no puede exceder 15 caracteres')
];
