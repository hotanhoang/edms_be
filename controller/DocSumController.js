const {
    onError,
    onSuccess,
    onDocSumFormat,
    hashMd5file
} = require("../utils/utils");
const {
    documents,
    shareDocuments,
    topic,
    docSumResults,
    aiConfig, aiCore, algorithm, mapAlgTypeAI, typeAI, typeOfFile, users
} = require("../models/init-models");
const fs = require("fs");
const { Op, where, fn, col } = require("sequelize");
const axios = require('axios');
const {
    ACTION_TYPE,
    PAGINATION_CONSTANTS,
    CORE_AI_SUMDOC, URL_API_SUMDOC, URL_API_ALGOR, FILE_KEY_TOPIC, CACHE_DOCS, USER_UPLOAD_DOCS, URL_API_MARK, TYPE_OF_FILE
} = require("../utils/constants");
const { fileDetails } = require("../utils/fileUpload");
const { logAction } = require("../utils/activityLog");
const { uploadFileTopic, uploadFile } = require("../middleware/fileUpload");
const WordExtractor = require("word-extractor");
const pdf = require('pdf-parse');
const extractor = new WordExtractor();
const moment = require("moment")
const path = require("path");

// const { DocxCounter, PdfCounter } = require("page-count");
// const countPages = require("page-count");
// const DocExtractor = require('docx-extractor');

module.exports = {
    // API tóm tắt văn bản
    sumDoc: async (req, res) => {
        try {
            const { userId } = req.user;
            const { inDocId, orginalSumary, reSum, topicIds, inTypeAI, page_from, page_to, longSum, inDisplayName } = req.body

            // Lấy thông tin kết quả tóm tắt văn bản (Nếu tồn tại)
            // const docSumInfo = await docSumResults.findOne({
            //     documentId: inDocId,
            //     algorId: algInfo.algorId,
            //     ownerId: userId
            // })
            // // Nếu tồn tại rồi thì kiểm tra xem tóm tắt mới hay lấy kết quả cũ
            // if (docSumInfo) {
            //     // Nếu lấy kết quả cũ thì return kết quả tóm tắt
            //     if (reSum === false) {
            //         return res.send(onSuccess({}))
            //     }
            // }
            var file_type = 0
            var raw_text = orginalSumary || ""
            var _orginalSumary = orginalSumary
            if (inDocId) {
                // Lấy thông tin document từ inDocId (Kiểm tra quyền chủ sử hữu hoặc được chia sẻ hay không?)
                const documentInfo = await documents.findOne({
                    where: {
                        documentId: inDocId,
                        // ownerId: userId,
                        enable: true,
                        // recycleBin: false
                    },
                    include: {
                        model: typeOfFile,
                        as: "typeOfFile",
                    },
                })
                if (documentInfo) {
                    _orginalSumary = documentInfo.content || ""
                    // Lấy dữ liệu base64 từ file đã tải lên
                    var bitmap = fs.readFileSync(`${USER_UPLOAD_DOCS}/${documentInfo.ownerId}/${inDocId}${documentInfo.typeOfFile.displayName}`);
                    // convert binary data to base64 encoded string
                    raw_text = new Buffer.from(bitmap).toString('base64');
                    if (documentInfo.typeOfFile.displayName === '.pdf') {
                        file_type = 1
                    } else {
                        if (documentInfo.typeOfFile.displayName === '.docx') {
                            file_type = 2
                        } else {
                            file_type = 3
                        }
                    }
                }
                // if (!documentInfo) {
                //     // Nếu không phải chủ sở hữu thì kiểm tra xem được chia sẻ hay không?
                //     const docShareUserId = await shareDocuments.findOne({
                //         where: {
                //             shareUserId: userId,
                //             documentId: inDocId,
                //             enable: true,
                //         },
                //     });
                //     if (!docShareUserId) {
                //         // await logAction(ACTION_TYPE.EDIT, {
                //         //     ownerId: userId,
                //         //     description: "Tài liệu không được chia sẻ với bạn",
                //         // });
                //         return res.send(
                //             onError(403, "Tài liệu không được chia sẻ với bạn")
                //         );
                //     }
                // }
            }
            // Lấy thông tin của chủ đề từ topicIds (Kiểm tra xem chủ đề có quyền sở hữu hay chia sẻ không?)
            // topicIds : Danh sách các chủ đề
            const lisTopicInfo = await topic.findAll({
                where: {
                    topicId: {
                        [Op.in]: topicIds
                    },
                    enable: true,
                },
            })
            if (lisTopicInfo.length !== topicIds.length) {
                return res.send(
                    onError(404, "Danh sách chủ đề không được tìm thấy")
                );
            }
            const topics = {}
            var sumByTopics = false
            for (let index = 0; index < lisTopicInfo.length; index++) {
                const element = lisTopicInfo[index];
                const valueKey = [element.andOrKeywords, element.notKeywords]
                topics[element.topicId] = valueKey
                sumByTopics = true
            }
            // Lấy danh sách cấu hình của user từ bảng aiConfig
            // inTypeAI = 1/2 => tóm tắt trích rút/ tóm lược (typeAIId trong bảng mapAlgTypeAI)
            const listAIConfig = await aiConfig.findAll({
                where: {
                    userId: userId,
                },
                include: [{
                    model: mapAlgTypeAI,
                    as: "mapAlgTypeAI",
                    where: {
                        typeAIId: inTypeAI
                    }
                }]
            })

            var SINGLE_SHORT_SUM = 0;
            var SINGLE_LONG_SUM = 0;

            listAIConfig.forEach(e => {
                if (e.mapAlgTypeAI.aiId === CORE_AI_SUMDOC.SINGLE_SHORT_SUM) {
                    SINGLE_SHORT_SUM = e.mapAlgTypeAIId
                }
                if (e.mapAlgTypeAI.aiId === CORE_AI_SUMDOC.SINGLE_LONG_SUM) {
                    SINGLE_LONG_SUM = e.mapAlgTypeAIId
                }
            });
            // Gọi API tóm tắt văn bản
            // raw_text = documentInfo.content
            // topic = topics
            // percent_output = longSum / 100
            // id_mapAlgTypeAI = [SINGLE_SHORT_SUM,SINGLE_LONG_SUM]

            // console.log('dataSumDoc : ',page_from, page_to)


            const percent_output = parseFloat((longSum / 100).toFixed(2))
            const dataSumDoc = {
                raw_text: raw_text,
                topic: topics,
                percent_output: percent_output,
                id_mapAlgTypeAI: [SINGLE_SHORT_SUM, SINGLE_LONG_SUM],
                file_type: file_type,
                page_from: (page_from >= 0) ? page_from : 0,
                page_to: (page_to >= 1) ? page_to : 999,
            }

            // const configAlg = {
            //     method: 'post',
            //     url: `${URL_API_ALGOR}`,
            //     data: dataSumDoc
            // }

            const configSum = {
                method: 'post',
                url: `${URL_API_SUMDOC}`,
                data: dataSumDoc
            }
            console.log('dataSumDoc : ', dataSumDoc)

            // Gọi API lấy thuật toán sử dụng
            // let algUse = await axios(configAlg)
            // console.log(' algUse : ', algUse.data)
            // Gọi API lấy kết quả tóm tắt
            let resultData = await axios(configSum)
            // console.log('result : ', resultData.data)
            // result = result.data.result;
            // let algUse = result.data.algorithm

            // const result = {
            //     cluster: [
            //         {
            //             "text": "Kết quả tóm tắt theo cụm 1",
            //             "displayName": "Cụm 1",
            //             "elem_arr": [0, 2, 3]
            //         },
            //         {
            //             "text": "Kết quả tóm tắt theo cụm 2",
            //             "displayName": "Cụm 2",
            //             "elem_arr": [1]
            //         }
            //     ],
            //     topic: [
            //         {
            //             "text": "Kết quả tóm tắt theo chủ đề 3",
            //             "displayName": 61,
            //             "elem_arr": [2]
            //         },
            //         {
            //             "text": "Kết quả tóm tắt theo chủ đề 4",
            //             "displayName": 62,
            //             "elem_arr": [1]
            //         }
            //     ]
            // }

            const { result, algorithm, original_text } = resultData.data
            // console.log('result  : ',result, algorithm)

            const docSumResult = []
            for (var key in result) {
                docSumResult.push({
                    text : result[key] || "Kết quả tóm tắt trống",
                    displayName : key,
                    elem_arr : [0],
                    mapAlgTypeAIId : algorithm[key],
                    original_text : original_text
                })
            }

            console.log('docSumResult : ',docSumResult)

            // if (!sumByTopics) {
            //     if (result.cluster && result.cluster.length !== 0) {
            //         result.cluster.forEach(e => {
            //             docSumResult.push({
            //                 ...e,
            //                 text: e.text || "Kết quả tóm tắt trống",
            //                 mapAlgTypeAIId: listAIConfig.mapAlgTypeAI.mapAlgTypeAIId
            //             })
            //         });
            //     }
            // } else {
            //     if (result.topic && result.topic.length !== 0) {
            //         result.topic.forEach(e => {
            //             docSumResult.push({
            //                 ...e,
            //                 text: e.text || "Kết quả tóm tắt trống",
            //                 mapAlgTypeAIId: listAIConfig.mapAlgTypeAI.mapAlgTypeAIId
            //             })
            //         });
            //     }
            // }

            // var docsum = false
            // var _topicIds = []
            // var _mapAlgTypeAIId = []
            // var _longSum = []
            // var _contentSumary = []
            // var _docSumId = []

            // for (var key in result) {
            //     docsum = true
            //     if (key !== 'non_topic') {
            //         _topicIds.push(key)
            //     }
            //     _mapAlgTypeAIId.push(algorithm[key])
            //     _longSum.push(percent_output)
            //     _contentSumary.push(result[key] || "Kết quả tóm tắt trống")
            //     _docSumId.push(null)
            //     // docsum.push({
            //     //     inDocId: inDocId || null,
            //     //     topicIds: key === 'non_topic' ? null : key,
            //     //     mapAlgTypeAIId: algorithm[key],
            //     //     longSum: percent_output,
            //     //     inDisplayName: inDisplayName,
            //     //     contentSumary: result[key],
            //     //     orginalSumary: inDocId ? _orginalSumary : raw_text,
            //     // });
            // }

            // if (docsum) {
            //     docsum = {
            //         inDocId: inDocId || null,
            //         topicIds: _topicIds,
            //         mapAlgTypeAIId: _mapAlgTypeAIId,
            //         longSum: _longSum,
            //         inDisplayName: inDisplayName,
            //         contentSumary: _contentSumary,
            //         orginalSumary: inDocId ? _orginalSumary : raw_text,
            //         docSumId: _docSumId,
            //         original_text: original_text
            //     }
            // }
            // Ghi log
            await logAction(ACTION_TYPE.SUMMARY_ACTION.SUMMARY_SINGLE, {
                ownerId: userId,
                ipAddress: req.ip,
                visible: true,
                description: `Tóm tắt thành công`,
            });
            return res.send(onSuccess(docSumResult));
        } catch (error) {
            console.log('error : ', error)
            return res.send(onError(500, error));
        }
    },
    // API người dùng upload file và trả về thông tin doc
    uploadFileSum: async (req, res) => {
        const { userId } = req.user;
        try {
            uploadFile(req, res, async (err) => {
                if (err) {
                    return res.send(onError(500, err));
                }
                const userCurrent = await users.findOne({
                    where: { userId },
                });
                const documentId = path.parse(req.file.filename).name;
                const typeOfFile = path.parse(req.file.filename).ext;

                const displayName = req.file.originalname;
                const pathToFile = req.file.path;

                let numpages = 0
                // 0: text (dữ liệu người dùng nhập)
                // 1: dữ liệu file pdf
                // 2: dữ liệu file docx
                // 3: dữ liệu file doc
                let type = 1

                // Kích thước thực của file
                const sizeOfFile = req.file.size;
                if (userCurrent) {
                    // Dung lượng của user được cấp từ admin
                    const userCapacity = userCurrent.capacity;
                    // Dung lượng mà user đã sử dụng
                    const usageStorage = userCurrent.usageStorage;
                    // Kiểm tra khả năng lưu file hiện tại của folder
                    if (userCapacity >= Math.floor(sizeOfFile / 1000) + usageStorage) {
                        // Lấy thông tin chi tiết của directory gốc của user
                        const folder = await documents.findOne({
                            where: {
                                ownerId: userId,
                                parentDirectoryId: null,
                                directory: true,
                                enable: true,
                            },
                        });
                        if (folder) {
                            // Lấy thông tin thư mục chứa các file tóm tắt văn bản với documentId = userId và parentDirectoryId = folder.documentId
                            const dirSumDoc = await documents.findOne({
                                where: {
                                    documentId: userId,
                                    ownerId: userId,
                                    parentDirectoryId: folder.documentId,
                                    directory: true,
                                },
                            });
                            let documentIdSum = ""
                            // Nếu chưa có thì tạo mới thư mục với documentId = userId và parentDirectoryId = folder.documentId
                            if (!dirSumDoc) {
                                // Tạo mới document vào CSDL
                                const newDirectory = await documents.create({
                                    documentId: userId,
                                    parentDirectoryId: folder.documentId,
                                    displayName: "Văn bản tóm tắt",
                                    directory: true,
                                    enable: true,
                                    ownerId: userId,
                                    description: "",
                                    inheritDirectoryId: [folder.documentId], // 
                                    originalDirectoryId: folder.originalDirectoryId || folder.documentId, // Thư mục gốc
                                });
                                documentIdSum = newDirectory.documentId
                            } else {
                                // Nếu thư mục đã bị xoá thì khôi phục lại
                                if (!dirSumDoc.enable) {
                                    dirSumDoc.enable = true
                                    dirSumDoc.recycleBin = false
                                    await dirSumDoc.save()
                                }
                                documentIdSum = dirSumDoc.documentId
                            }
                            // Đọc nội dung của file
                            // Lấy thông tin chi tiết của file trên ổ đĩa
                            const sizeOnDisk = await fileDetails(req, res);
                            // Lấy thông tin các documentId của các thư mục cha trước
                            const inheritDirctoryIdArray =
                                folder.inheritDirectoryId || [];
                            const inheritDirectoryId = inheritDirctoryIdArray.concat([
                                folder.documentId, documentIdSum
                            ]);

                            // Lấy thông tin documentId thư mục root (Thư mục gốc)
                            const originalDirectoryId =
                                folder.originalDirectoryId || folder.documentId;

                            // const timestamp = Math.floor(new Date().getTime() / 1000);
                            // const documentId = hashesID(userCurrent.username);

                            // Đọc nội dung của file tải lên
                            // Kiểm tra xem file đang ở định dạng nào?

                            let content = ""
                            try {
                                if (typeOfFile === ".pdf") {
                                    let dataBuffer = fs.readFileSync(pathToFile);
                                    const doc = await pdf(dataBuffer) // options
                                    content = doc.text
                                    numpages = doc.numpages
                                    type = 1
                                    // fs.writeFileSync('readFile.txt', content)
                                } else {
                                    const doc = await extractor.extract(pathToFile)
                                    content = doc.getBody()
                                    if (typeOfFile === ".docx") {
                                        numpages = null
                                        type = 2
                                    }
                                    if (typeOfFile === ".doc") {
                                        numpages = null
                                        type = 3
                                    }
                                }
                            } catch (error) {
                            }
                            // Tạo md5 và kiểm tra trước khi lưu file vào CSDL
                            // Tạo hash md5
                            const md5 = await hashMd5file(pathToFile)
                            // Tìm doccument có hashmd5 = md5
                            if (md5) {
                                const docByMd5 = await documents.findOne({
                                    where: {
                                        hashmd5: md5,
                                        recycleBin: false,
                                        enable: true
                                    },
                                });
                                if (docByMd5) {
                                    // Xoá file vừa upload lên
                                    fs.rmSync(pathToFile, { recursive: true, force: true });
                                    // Trả về thông tin document
                                    return res.send(onSuccess({
                                        documentId: docByMd5.documentId,
                                        displayName: docByMd5.displayName,
                                        numpages: numpages,
                                        type: type,
                                        content: docByMd5.content
                                    }));
                                }
                            }
                            const newFile = {
                                documentId,
                                ownerId: userId,
                                parentDirectoryId: documentIdSum,
                                displayName: displayName,
                                inheritDirectoryId,
                                originalDirectoryId,
                                enable: true,
                                typeOfFileId: TYPE_OF_FILE[typeOfFile],
                                sizeOfFile: Math.floor(sizeOfFile / 1000),
                                sizeOfFileOnDisk: sizeOnDisk.size,
                                directory: false,
                                content: content,
                                hashmd5: md5 || null
                            };
                            // Cập nhật thông tin vào csdl
                            const newDocsUpload = await documents.create(newFile);
                            // Cập nhật thông tin của usageStorage của user
                            userCurrent.usageStorage =
                                userCurrent.usageStorage + sizeOnDisk.size;

                            await userCurrent.save();

                            await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
                                ownerId: userId,
                                ipAddress: req.ip,
                                visible: true,
                                description: `Tải file '${newDocsUpload.displayName}' lên thành công`,
                            });
                            return res.send(onSuccess({
                                documentId: documentId,
                                displayName: displayName,
                                numpages: numpages,
                                type: type,
                                content: content
                            }));
                        }
                        fs.rmSync(pathToFile, { recursive: true, force: true });
                        return res.send(
                            onError(404, `Thư mục cha không tồn tại!`)
                        );
                    }
                    fs.rmSync(pathToFile, { recursive: true, force: true });
                    return res.send(onError(411, "Hết dung lượng lưu trữ"));
                }
                fs.rmSync(pathToFile, { recursive: true, force: true });
                return res.send(onError(403, "Tài khoản không có quyền."));
            });
        } catch (error) {
            if (error.code == "LIMIT_FILE_SIZE") {
                return res.send(onError(414, "Kích thước file lớn hơn 25MB"));
            }
            return res.send(onError(500, error));
        }
    },
    // API lựa chọn doc từ driver và trả về thông tin doc
    selectSumDoc: async (req, res) => {
        try {
            const { userId } = req.user;
            const { documentId } = req.body;
            // Trả về thông tin tên hiển thị, số trang, kiểu file tải lên
            let displayName = ""
            let content = ""
            let numpages = 0
            // 0: text (dữ liệu người dùng nhập)
            // 1: dữ liệu file pdf
            // 2: dữ liệu file docx
            // 3: dữ liệu file doc
            let type = 1

            const documentInfo = await documents.findOne({
                where: {
                    documentId,
                    enable: true,
                },
                include: {
                    model: typeOfFile,
                    as: "typeOfFile",
                },
            });
            if (!documentInfo)
                return res.send(onError(404, "Không tìm thấy file/thư mục"));
            if (documentInfo.ownerId !== userId) {
                // Kiểm tra xem document có được chia sẻ với userId hay không?
                const shareDocInfo = await shareDocuments.findOne({
                    where: {
                        documentId,
                        shareUserId: userId,
                        enable: true,
                    },
                });
                if (!shareDocInfo)
                    return res.send(onError(403, "Tài khoản không được phép thực hiện"));
            }

            const pathDoc = `${USER_UPLOAD_DOCS}/${documentInfo.ownerId}/${documentInfo.documentId}${documentInfo.typeOfFile.displayName}`;
            try {
                // read binary data
                // var bitmap = fs.readFileSync(pathDoc);
                // // convert binary data to base64 encoded string
                // dataBase64 = new Buffer.from(bitmap).toString('base64');
                if (documentInfo.typeOfFile.displayName === ".pdf") {
                    let pdfBuffer = fs.readFileSync(pathDoc);
                    const doc = await pdf(pdfBuffer)
                    // content = doc.text
                    numpages = doc.numpages
                    displayName = documentInfo.displayName
                    content = documentInfo.content
                    type = 1
                } else {
                    if (documentInfo.typeOfFile.displayName === ".docx") {
                        // const doc = await extractor.extract(`${FILE_KEY_TOPIC}/${filename}`)
                        // content = doc.getBody()
                        // const docx = await getPageCount(`${FILE_KEY_TOPIC}/${filename}`)
                        // const docx = DocExtractor.numberPages(`${FILE_KEY_TOPIC}/${filename}`)
                        // console.log('vào đây 1')
                        // let docxBuffer = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
                        // console.log('vào đây 2')
                        // const pagesDocx = await DocxCounter.count(docxBuffer);
                        // console.log('vào đây 3')
                        numpages = null
                        displayName = documentInfo.displayName
                        content = documentInfo.content
                        type = 2
                    } else {
                        if (documentInfo.typeOfFile.displayName === ".doc") {
                            // const doc = DocExtractor.numberPages(`${FILE_KEY_TOPIC}/${filename}`)
                            // let docBuffer = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
                            // const pagesDoc = await DocxCounter.count(docBuffer);
                            numpages = null
                            displayName = documentInfo.displayName
                            content = documentInfo.content
                            type = 3
                        }
                    }
                }
                // Xoá file vừa đọc trên ổ đĩa
                // fs.rmSync(`${FILE_KEY_TOPIC}/${filename}`, { recursive: true, force: true });
            } catch (error) {
            }
            return res.send(onSuccess({
                documentId: documentId,
                displayName: displayName,
                numpages: numpages,
                type: type,
                content: content
            }));
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API hiển thi nội dung xem trước file
    previewDocSum: async (req, res) => {
        try {
            const { filename } = req.params;
            let docDownloadUrl = `${filename}`;
            // Xoá file vừa đọc trên ổ đĩa
            return res.sendFile(docDownloadUrl, { root: FILE_KEY_TOPIC })
        } catch (error) {
        }
    },
    // API lưu thông tin tóm tắt vào CSDL
    addSumResult: async (req, res) => {
        try {
            const { userId } = req.user;
            const { docSumIds, inDocId, topicIds, mapAlgTypeAIIds, longSum,
                inDisplayName, contentSumary, orginalSumary, original_text } = req.body
            if (inDocId) {
                // Kiểm tra tính hợp lệ của documentId
                const documentInfo = await documents.findOne({
                    where: {
                        documentId: inDocId,
                        ownerId: userId,
                        // enable: true,
                        // recycleBin: false
                    },
                })
                if (!documentInfo) {
                    // Nếu không phải chủ sở hữu thì kiểm tra xem được chia sẻ hay không?
                    const docShareUserId = await shareDocuments.findOne({
                        where: {
                            shareUserId: userId,
                            documentId: inDocId,
                            enable: true,
                        },
                    });
                    if (!docShareUserId) {
                        return res.send(
                            onError(403, "Tài liệu không được chia sẻ với bạn")
                        );
                    }
                }
            }
            let docSumids = []
            // topicIds.length === mapAlgTypeAIIds.length === contentSumary.length === docSumIds.length
            // console.log('docSumIds : ', docSumIds, mapAlgTypeAIIds)
            for (let index = 0; index < contentSumary.length; index++) {
                const topicId = topicIds[index];
                const mapAlgTypeAIId = mapAlgTypeAIIds ? mapAlgTypeAIIds[index] : null
                const resultSumDoc = contentSumary[index]
                const docSumId = docSumIds[index]
                // Kiểm tra tính hợp lệ của topicId
                if (topicId) {
                    const topicInfo = await topic.findOne({
                        where: { topicId },
                    });
                    if (!topicInfo) {
                        return res.send(onError(404, "Mã topicId không tồn tại"));
                    }
                }
                // Nếu docSumId thì cập nhật dữ liệu theo docSumId
                if (docSumId) {
                    // Lấy thông tin docSum từ inDocSumId
                    const docSumInfo = await docSumResults.findOne({
                        where: {
                            docSumId: docSumId,
                            enable: true
                        }
                    })
                    if (!docSumInfo) {
                        // Thông tin tóm tắt không tồn tại
                        return res.send(
                            onError(404, "Thông tin tóm tắt không tồn tại")
                        );
                    }
                    if (docSumInfo.ownerId !== userId) {
                        return res.send(
                            onError(403, "Tài khoản không có quyền thực hiện")
                        );
                    }
                    // Các thông tin cần thay đổi bao gồm nội dung đã được tóm tắt, Tên hiển thị tóm tắt, Trạng thái enable
                    docSumInfo.contentSumary = resultSumDoc || docSumInfo.contentSumary
                    docSumInfo.topicId = topicId || docSumInfo.topicId
                    docSumInfo.mapAlgTypeAIId = mapAlgTypeAIId || docSumInfo.mapAlgTypeAIId
                    docSumInfo.percentLong = longSum || docSumInfo.percentLong
                    docSumInfo.orginalSumary = orginalSumary || docSumInfo.orginalSumary
                    docSumInfo.original_text = original_text || docSumInfo.original_text
                    docSumInfo.lastModify = new Date()
                    // if (enable !== undefined) {
                    //     docSumInfo.enable = enable
                    // }
                    await docSumInfo.save()
                    docSumids.push(docSumId)
                } else {
                    const displayName = inDisplayName.split('.')
                    const result = await docSumResults.create({
                        documentId: inDocId || null,
                        ownerId: userId,
                        displayName: displayName.length === 2 ? `${displayName[0]}_sum.${displayName[1]}` : `${displayName[0]}_sum`,
                        contentSumary: resultSumDoc,
                        orginalSumary: orginalSumary,
                        topicId: topicId || null,
                        mapAlgTypeAIId: mapAlgTypeAIId,
                        percentLong: longSum,
                        original_text: original_text
                    })
                    docSumids.push(result.docSumId)
                }
            }
            return res.send(onSuccess({
                docSumId: docSumids,
            }));
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API xoá tóm tắt văn bản
    deleteDocSum: async (req, res) => {
        try {
            const { userId } = req.user;
            const { docSumId } = req.params;
            // Tìm docSumInfo theo docSumId
            const docSumInfo = await docSumResults.findOne({
                where: {
                    docSumId,
                    ownerId: userId
                }
            })
            if (!docSumInfo) {
                return res.send(onError(404, "Không tìm thấy kết quả tóm tắt"));
            }
            docSumInfo.enable = false
            await docSumInfo.save()
            return res.send(onSuccess({}));
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API lấy danh sách tóm tắt văn bản
    getDocSum: async (req, res) => {
        // Lọc theo inDocSumId
        try {
            const { userId } = req.user;
            const pagination = req.pagination;
            const {
                inDocSumId,
                pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index,
            } = req.query;
            // Lấy thông tin Docsum theo điều kiện ownerId = userId, enable = true
            // Thêm bộ lọc theo inDocSumId, enable
            const inDocQuery =
                inDocSumId !== undefined
                    ? {
                        docSumId: JSON.parse(inDocSumId),
                    }
                    : {};
            var filterParams = {
                enable: true,
                ownerId: userId,
                ...inDocQuery
            }
            var filterQuery = {
                offset: pagination.offset,
                limit: pagination.limit,
                order: [["createdDate", "DESC"]],
                where: filterParams,
                include: [
                    {
                        model: topic,
                        as: "topic",
                        // Chỉ lấy các thuộc tính
                        attributes: ["topicId", "displayName"],
                    },
                    {
                        model: documents,
                        as: "document",
                        // Chỉ lấy các thuộc tính
                        attributes: ["enable", "content"],
                    },
                    {
                        model: mapAlgTypeAI,
                        as: "mapAlgTypeAI",
                        include: [
                            {
                                model: aiCore,
                                as: "ai",
                            }, {
                                model: typeAI,
                                as: "typeAI",
                            }, {
                                model: algorithm,
                                as: "algor",
                            }
                        ]
                    }
                ]
            }
            // Thực hiện truy vấn kết quả
            const { count, rows } = await docSumResults.findAndCountAll(filterQuery);
            const results = rows.map((e) => {
                return onDocSumFormat(e);
            });
            // await logAction(ACTION_TYPE.GET, {
            //     description: "Lấy danh sách tóm tắt văn bản thành công",
            // });
            return res.send(onSuccess({
                listDocSums: results,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }));
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API sửa kết quả tóm tắt đơn văn bản
    editDocSum: async (req, res) => {
        // Lấy theo inDocSumId
        try {
            const { userId } = req.user;
            const { inDocSumId } = req.params;
            const { inContent, topicId, mapAlgTypeAIId, longSum, orginalSumary } = req.body
            // console.log('longSum : ', longSum)
            // Lấy thông tin docSum từ inDocSumId
            const docSumInfo = await docSumResults.findOne({
                where: {
                    docSumId: inDocSumId,
                    enable: true
                }
            })
            if (!docSumInfo) {
                // Thông tin tóm tắt không tồn tại
                return res.send(
                    onError(404, "Thông tin tóm tắt không tồn tại")
                );
            }
            if (docSumInfo.ownerId !== userId) {
                return res.send(
                    onError(403, "Tài khoản không có quyền thực hiện")
                );
            }
            // Các thông tin cần thay đổi bao gồm nội dung đã được tóm tắt, Tên hiển thị tóm tắt, Trạng thái enable
            docSumInfo.contentSumary = inContent || docSumInfo.contentSumary
            docSumInfo.topicId = topicId || docSumInfo.topicId
            docSumInfo.mapAlgTypeAIId = mapAlgTypeAIId || docSumInfo.mapAlgTypeAIId
            docSumInfo.percentLong = longSum || docSumInfo.percentLong
            docSumInfo.orginalSumary = orginalSumary || docSumInfo.orginalSumary
            // docSumInfo.displayName = displayName || docSumInfo.displayName
            docSumInfo.lastModify = new Date()
            // if (enable !== undefined) {
            //     docSumInfo.enable = enable
            // }
            await docSumInfo.save()
            // await logAction(ACTION_TYPE.EDIT, {
            //     ownerId: userId,
            //     description: "Cập nhật thông tin tóm tắt văn bản thành công",
            // });
            return res.send(onSuccess({}))

        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API dowload kết quả tóm tắt đơn văn bản
    downloadDocSum: async (req, res) => {
        try {
            const { userId } = req.user;
            const { inDisplayName, inDocSumId, contentSumDoc, original_text } = req.body;
            // console.log('original_text : ', original_text)
            const timestamp = Math.floor(new Date().getTime() / 1000);
            const pathDoc = `${CACHE_DOCS}/Tóm tắt-${inDisplayName.split(".")[0]}-${timestamp}.docx`;
            if (original_text) {
                fs.writeFileSync(pathDoc, 'Nội dung tóm tắt\n\n' + original_text + '\n\nKết quả tóm tắt\n\n' + contentSumDoc);
            } else {
                fs.writeFileSync(pathDoc, 'Không tìm thấy nội dung tóm tắt\n\n' + '\n\nKết quả tóm tắt\n\n' + contentSumDoc);
            }

            res.download(pathDoc, async function (err) {
                if (err) {
                    return res.send(onError(500, err));
                }
                // Xoá tệp đã nén
                fs.rmSync(pathDoc, { recursive: true, force: true });
            });
            // Lấy thông tin docSum từ inDocSumId
            // const docSumInfo = await docSumResults.findOne({
            //     where: {
            //         docSumId: inDocSumId,
            //         enable: true,
            //     }
            // })
            // if (!docSumInfo) {
            //     // Thông tin tóm tắt không tồn tại
            //     return res.send(
            //         onError(404, "Thông tin tóm tắt không tồn tại")
            //     );
            // }
            // if (docSumInfo.ownerId !== userId) {
            //     return res.send(
            //         onError(403, "Tài khoản không có quyền thực hiện")
            //     );
            // }
            // Tạo documentId với nội dung vừa tóm tắt được
            // displayName : docSumInfo.displayName

        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API lấy các thực thể
    entityMark: async (req, res) => {
        try {
            const { content } = req.body;
            const config = {
                method: 'post',
                url: `${URL_API_MARK}/NER2`,
                data: {
                    text: content
                }
            }
            let result = await axios(config)
            return res.send(onSuccess(result.data));
        } catch (error) {
            return res.send(onError(500, error));
        }
    }
};
