import Sequence from '../models/Sequence.js';

export const generateDriverId = async (type) => {
    let prefix = 'D';
    if (type === 'TRUCK') prefix = 'TD';
    else if (type === 'PICKUP') prefix = 'PD';

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const sequenceId = `driver_${prefix}_${year}`;

    try {
        const sequence = await Sequence.findByIdAndUpdate(
            sequenceId,
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const seqStr = sequence.seq.toString().padStart(3, '0');
        return `${prefix}${year}${seqStr}`;
    } catch (error) {
        console.error("Error generating Driver ID:", error);
        throw error;
    }
};
