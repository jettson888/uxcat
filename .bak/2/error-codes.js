export const ErrorCodes = {
    SUCCESS: '0',
    FILE_IO_ERROR: '1001',
    MODEL_TIMEOUT: '2001',
    MODEL_REQUEST_FAILED: '2002',
    MODEL_INTERRUPTED: '2003',
    INTERNAL_SERVER_ERROR: '5000',
    VALIDATION_ERROR: '4000',
    NOT_FOUND: '4004',
    METHOD_NOT_ALLOW:'4005',
};

export const ErrorMessages = {
    [ErrorCodes.SUCCESS]: 'Success',
    [ErrorCodes.FILE_IO_ERROR]: 'File I/O Error',
    [ErrorCodes.MODEL_TIMEOUT]: 'Model Response Timeout',
    [ErrorCodes.MODEL_REQUEST_FAILED]: 'Model Request Failed',
    [ErrorCodes.MODEL_INTERRUPTED]: 'Model Response Interrupted',
    [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    [ErrorCodes.VALIDATION_ERROR]: 'Validation Error',
    [ErrorCodes.NOT_FOUND]: 'Resource Not Found',
};
