import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true,
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: 100 // Max number of times this coupon can be used
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Check isValid
couponSchema.methods.isValid = function () {
    if (!this.isActive) return false;
    if (this.expiryDate < new Date()) return false;
    if (this.usageCount >= this.usageLimit) return false;
    return true;
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
