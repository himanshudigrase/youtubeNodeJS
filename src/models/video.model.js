import mongoose,{Schema} from "mongoose";
/*A cursor based custom aggregate pagination 
library for Mongoose with customizable labels.
 */
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile:{
        type: String, // cloudinary URL
        required: true, 
    },
    thumbnail:{
        type: String, // cloudinary url
        required: true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,

    },
    duration:{
        type: Number,
        required: true
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema);