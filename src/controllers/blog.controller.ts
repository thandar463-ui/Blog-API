import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { CreateBlogApiDto } from "../dtos/create-blog-api.dto";
import { BlogListDto } from "../dtos/blog-list.dto";
import { UpdateBlogDto } from "../dtos/update-blog.dto";
import { ApiError } from "./api-error";
import { handleErrors } from "./handle-error";
import * as blogService from "../model/blog.service";
import { CreateCommentApiDto } from "../dtos/create_comment-api.dto";
import { CreateReplyApiDto } from "../dtos/create_reply-api.dto";
import { GetEnagementDto } from "../dtos/get-enagement-dto";
import { GetBlogListCategoryDto } from "../dtos/get-bloglist-by-category.dto";
import { SearchUserApiDto } from "../dtos/search-user-api.dto";
import { CursorBlogListDto } from "../dtos/cursor-blog-list.dto";
import { CreateReportDto } from "../dtos/create-report.dto";
import { ReportListDto } from "../dtos/report-list.dto";
import { ReportInfoListDto } from "../dtos/reportInfo-list.dto";


export async function createBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ meaaage: "Unauthorized", });
        }

        if (typeof req.body.categoryIds === "string") {
            req.body.categoryIds = [req.body.categoryIds];
        }


        const input = CreateBlogApiDto.parse(req.body);
        const coverImage = req.file?.filename;
        console.log(req.body);
        console.log(req.file);
        const blog = await blogService.createBlog(req.user.id, input, coverImage);

        return res.status(201).json({
            message: "Blog created successfully",
            data: blog,
        });

    } catch (err) {
        next(err);
    }
}

export async function publishBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({
                message: "Blog id is required",
            });
        }

        const blog = await blogService.publishBlog(blogId as string, req.user.id);
        return res.status(200).json({
            message:
                "Blog published successfully",
            data: blog,
        });
    } catch (err) {
        next(err);
    }
}

export async function blogList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const authorId = req.user?.id
        console.log(authorId);
        const input = BlogListDto.parse(req.body);
        const result = await blogService.blogList(authorId as string, input);

        return res.status(200).json({
            message: "Blogs feteched successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
}

export async function updateBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const blogId = req.params.id;
        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const input = UpdateBlogDto.parse(req.body);

        const coverImage = req.file?.filename;

        const blog = await blogService.updateBlog(blogId as string, req.user.id, input, coverImage);

        return res.status(200).json({
            message: "Blog updated successfully",
            data: blog,
        });

    } catch (err) {
        next(err);
    }
}

export async function deleteBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const blogId = req.params.id;
        const authorId = req.user?.id;
        const result = await blogService.deleteBlog(blogId as string, authorId);

        return res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
            deletedAt: result.deletedAt,
        });
    } catch (err) {
        next(err);
    }
}

export async function getBlogDetail(req: Request, res: Response, next: NextFunction) {
    try {
        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ meaasge: "Blog id is required", });
        }

        const blog = await blogService.getBlogDetail(blogId as string);

        return res.status(200).json({
            message: "Blog fetched successfully",
            data: blog,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function saveBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const result = await blogService.saveBlog(userId, blogId as string);

        return res.status(201).json({
            message: "Blog saved successfully",
            data: result,
        });

    } catch (err) {
        next(err);
    }
}

export async function removeSavedBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const userId = req.user?.id;

        const blogId = req.params.id;
        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const result = await blogService.removeSavedBlog(userId, blogId as string);
        return res.status(201).json({
            message: "SavedBlog removed successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getSavedBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const userId = req.user?.id;
        const input = BlogListDto.parse(req.body);
        const result = await blogService.getSavedBlog(userId, input);

        return res.status(201).json({
            message: "Savedblogs feteched successfully",
            data: result,
        });

    } catch (err) {
        next(err);
    }
}

export async function likeBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const result = await blogService.likeBlog(userId, blogId as string);

        return res.status(201).json({
            message: "Blog liked successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function unlikedBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const userId = req.user?.id;

        const blogId = req.params.id;
        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const result = await blogService.unlikedBlog(userId, blogId as string);
        return res.status(201).json({
            message: "Blog unliked successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });

        }
        const userId = req.user?.id;

        const input = CreateCommentApiDto.parse(req.body);

        const comment = await blogService.createComment(userId, input);

        return res.status(201).json({
            success: true,
            message: "Comment created successfully",
            data: comment,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function createReply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const userId = req.user?.id;
        const input = CreateReplyApiDto.parse(req.body);

        const reply = await blogService.createReply(userId, input);

        return res.status(201).json({
            success: true,
            message: " Reply on comment of blog post created successfully",
            data: reply,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function commentList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        const blogId = req.params.id;
        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const input = BlogListDto.parse(req.body);
        const result = await blogService.commentList(blogId as string, input);

        return res.status(200).json({
            message: "Comments feteched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function replyList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        const blogId = req.params.id;
        const commentId = req.params.commentId;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        if (!commentId) {
            return res.status(400).json({ message: "Comment id is required", });
        }

        const input = BlogListDto.parse(req.body);

        const result = await blogService.replyList(blogId as string, commentId as string, input);

        return res.status(201).json({
            message: "Replies fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function viewBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const result = await blogService.viewBlog(blogId as string, userId);

        return res.status(201).json({
            message: "Blog viewed successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function ownBlogList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const authorId = req.user?.id
        console.log(authorId);
        const input = BlogListDto.parse(req.body);
        const result = await blogService.ownBlogList(authorId as string, input);

        return res.status(200).json({
            message: "Blogs feteched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getBlogStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const result = await blogService.getBlogStats(blogId as string, userId);

        return res.status(201).json({
            message: "Blog stats fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function readBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }

        const result = await blogService.readBlog(blogId as string, userId);

        return res.status(201).json({
            message: "Blog mark as read",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getBlogEnagement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }
        const input = GetEnagementDto.parse(req.body);
        const result = await blogService.getBlogEnagement(blogId as string, userId, input);

        return res.status(201).json({
            message: "Blog enagement fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getBlogCategoryList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const authorId = req.user?.id
        const input = GetBlogListCategoryDto.parse(req.body);

        const result = await blogService.getBlogCategoryList(authorId as string, input);

        return res.status(200).json({
            message: "Blogs category fetched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function searchBlogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const input = CursorBlogListDto.parse(req.body);

        const result = await blogService.searchBlogs(req.user.id, input);

        return res.status(200).json({
            message: "Blogs searched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({ message: "Blog id is required", });
        }
        const input = CreateReportDto.parse(req.body);

        const result = await blogService.createReport(blogId as string, userId, input);

        return res.status(200).json({
            message: "Report submitted successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }

}

export async function ReportList(req: AuthenticatedRequest, res: Response) {
    try {
        const input = ReportListDto.parse(req.body);

        const report = await blogService.getReportList(input);

        return res.status(200).json({
            message: "Report list fetched successfully",
            data: report,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getReportInfoList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {


        const reportId = req.params.id;

        if (!reportId) {
            return res.status(400).json({ message: "Report id is required", });
        }
        const input = ReportInfoListDto.parse(req.body);

        const result = await blogService.getReportInfoList(reportId as string, input);

        return res.status(200).json({
            message: "Reportinfo list fetched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }

}