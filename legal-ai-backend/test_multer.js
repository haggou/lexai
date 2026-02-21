
import multer from 'multer';
try {
    console.log('Multer type:', typeof multer);
    if (typeof multer === 'function') {
        console.log('Multer import successful');
    } else {
        console.log('Multer import failed (not a function)');
    }
} catch (e) {
    console.error('Error importing multer:', e);
}

