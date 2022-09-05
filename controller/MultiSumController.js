const {
    onError,
    onSuccess,
    onMultiDocSumFormat
} = require("../utils/utils");
const {
    documents,
    shareDocuments,
    topic,
    docSumResults,
    aiConfig, aiCore, algorithm,
    mapAlgTypeAI, typeAI, typeOfFile,
    clusterMultiDoc, multiDoc, multiDocSumResults,
} = require("../models/init-models");
const fs = require("fs");
const { Op, where, fn, col } = require("sequelize");
const axios = require('axios');
const {
    ACTION_TYPE,
    PAGINATION_CONSTANTS,
    CORE_AI_SUMDOC, URL_API_MUTILDOC, USER_UPLOAD_DOCS
} = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const { uploadFileSum } = require("../middleware/fileUpload");
const WordExtractor = require("word-extractor");
const pdf = require('pdf-parse');
const extractor = new WordExtractor();
const moment = require("moment")

module.exports = {
    // API tóm tắt văn bản
    sumDoc: async (req, res) => {
        try {
            const { userId } = req.user;
            const { inListDocId, inListTopicId, inTypeAIId, cluster, longSum, file_type, inDisplayName } = req.body
            // console.log('req.body : ', req.body)
            var raw_text = []
            var orginalSumary = []

            if (inListDocId.length < 2) {
                return res.send(
                    onError(404, "Không tìm thấy tài nguyên")
                );
            }
            let listDocumentInfo = []
            // Lấy thông tin các document từ inListDocId (Kiểm tra quyền chủ sử hữu hoặc được chia sẻ hay không?)
            for (let index = 0; index < inListDocId.length; index++) {
                const element = inListDocId[index];
                const documentInfo = await documents.findOne({
                    where: {
                        documentId: element,
                        ownerId: userId,
                        enable: true,
                        recycleBin: false
                    },
                    include: {
                        model: typeOfFile,
                        as: "typeOfFile",
                    },
                })
                if (!documentInfo) {
                    // Nếu không phải chủ sở hữu thì kiểm tra xem được chia sẻ hay không?
                    const docShareUserId = await shareDocuments.findOne({
                        where: {
                            shareUserId: userId,
                            documentId: element,
                            enable: true,
                        },
                    });
                    if (!docShareUserId) {
                        return res.send(
                            onError(403, "Tài liệu không được chia sẻ với bạn")
                        );
                    }
                }
                listDocumentInfo.push(documentInfo)
                // Lấy thông tin base64 của văn bản
                orginalSumary.push(documentInfo.content || "")
                // Lấy dữ liệu base64 từ file đã tải lên
                const bitmap = fs.readFileSync(`${USER_UPLOAD_DOCS}/${documentInfo.ownerId}/${element}${documentInfo.typeOfFile.displayName}`);
                // convert binary data to base64 encoded string
                raw_text.push(new Buffer.from(bitmap).toString('base64'))
            }

            // Lấy thông tin của chủ đề từ topicIds (Kiểm tra xem chủ đề có quyền sở hữu hay chia sẻ không?)
            // topicIds : Danh sách các chủ đề
            const topics = []

            if (inListTopicId.length !== 0) {
                const lisTopicInfo = await topic.findAll({
                    where: {
                        topicId: {
                            [Op.in]: inListTopicId
                        },
                        enable: true,
                    },
                })
                if (lisTopicInfo.length !== inListTopicId.length) {
                    return res.send(
                        onError(404, "Danh sách chủ đề không được tìm thấy")
                    );
                }
                for (let index = 0; index < lisTopicInfo.length; index++) {
                    const element = lisTopicInfo[index];
                    const valueKey = [element.andOrKeywords, element.notKeywords]
                    topics.push({
                        logic: valueKey,
                        displayName: element.topicId
                    })
                }
            }

            // Lấy danh sách cấu hình của user từ bảng aiConfig
            // inTypeAI = 1 / 2 => tóm tắt trích rút/ tóm lược (typeAIId trong bảng mapAlgTypeAI)
            // aiId : Tóm tắt đa văn bản
            const listAIConfig = await aiConfig.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model: mapAlgTypeAI,
                    as: "mapAlgTypeAI",
                    where: {
                        typeAIId: inTypeAIId,
                        aiId: CORE_AI_SUMDOC.MULTI_SUM_DOC
                    }
                }]
            })
            // Gọi API tóm tắt văn bản
            // id_mapAlgTypeAI = [SINGLE_SHORT_SUM,SINGLE_LONG_SUM]
            const percent_output = parseFloat((longSum / 100).toFixed(2))
            const dataSumDoc = {
                raw_text: raw_text,
                topic: topics,
                percent_output: percent_output,
                id_mapAlgTypeAI: [listAIConfig.mapAlgTypeAI.mapAlgTypeAIId],
                cluster: cluster,
                file_type: file_type
            }

            const configSum = {
                method: 'post',
                url: `${URL_API_MUTILDOC}`,
                data: dataSumDoc
            }
            // console.log('dataSumDoc : ', dataSumDoc, inListDocId.length)
            console.log('listAIConfig : ', listAIConfig.mapAlgTypeAI.mapAlgTypeAIId)

            // Gọi API lấy kết quả tóm tắt
            let result = await axios(configSum)
            result = result.data.result;
            console.log(' result : ', result)
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
            //         },
            //         {
            //             "text": null,
            //             "displayName": 73,
            //             "elem_arr": []
            //         }
            //     ]
            // }
            const docSumResult = []
            // Nếu là tóm tắt theo cụm
            if (cluster) {
                if (result.cluster && result.cluster.length !== 0) {
                    result.cluster.forEach(e => {
                        docSumResult.push({
                            ...e,
                            text: e.text || "Kết quả tóm tắt trống",
                            mapAlgTypeAIId: listAIConfig.mapAlgTypeAI.mapAlgTypeAIId
                        })
                    });
                }
            } else {
                if (result.topic && result.topic.length !== 0) {
                    result.topic.forEach(e => {
                        docSumResult.push({
                            ...e,
                            text: e.text || "Kết quả tóm tắt trống",
                            mapAlgTypeAIId: listAIConfig.mapAlgTypeAI.mapAlgTypeAIId
                        })
                    });
                }
            }
            console.log('docSumResult : ', docSumResult)
            return res.send(onSuccess(docSumResult));
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // // API upload văn bản
    // uploadSumDoc: async (req, res) => {
    //     try {
    //         const { userId } = req.user;
    //         uploadFileSum(req, res, async (err) => {
    //             if (err) {
    //                 return res.send(onError(500, err));
    //             }
    //             // Lấy thông tin thư mục gốc và thư mục lưu trữ file upload
    //             // Lấy thông tin chi tiết của directory gốc của user
    //             const folder = await documents.findOne({
    //                 where: {
    //                     ownerId: userId,
    //                     parentDirectoryId: null,
    //                     directory: true,
    //                     enable: true,
    //                 },
    //             });
    //             if (folder) {
    //                 // Lấy thông tin thư mục chứa các file tóm tắt văn bản với documentId = userId và parentDirectoryId = folder.documentId
    //                 const dirSumDoc = await documents.findOne({
    //                     where: {
    //                         documentId: userId,
    //                         ownerId: userId,
    //                         parentDirectoryId: folder.documentId,
    //                         directory: true,
    //                     },
    //                 });
    //                 let documentIdSum = ""
    //                 // Nếu chưa có thì tạo mới thư mục với documentId = userId và parentDirectoryId = folder.documentId
    //                 if (!dirSumDoc) {
    //                     // Tạo mới document vào CSDL
    //                     const newDirectory = await documents.create({
    //                         documentId: userId,
    //                         parentDirectoryId: folder.documentId,
    //                         displayName: "Văn bản tóm tắt",
    //                         directory: true,
    //                         enable: true,
    //                         ownerId: userId,
    //                         description: "",
    //                         inheritDirectoryId: [folder.documentId], // 
    //                         originalDirectoryId: folder.originalDirectoryId || folder.documentId, // Thư mục gốc
    //                     });
    //                     documentIdSum = newDirectory.documentId
    //                 } else {
    //                     // Nếu thư mục đã bị xoá thì khôi phục lại
    //                     if (!dirSumDoc.enable) {
    //                         dirSumDoc.enable = true
    //                         dirSumDoc.recycleBin = false
    //                         await dirSumDoc.save()
    //                     }
    //                     documentIdSum = dirSumDoc.documentId
    //                 }
    //                 // Lấy thông tin file vừa upload 
    //                 let fileInfoUpload = []
    //                 if (req.files.length !== 0) {

    //                 }
    //                 return res.send(onSuccess(fileInfoUpload));
    //                 // {
    //                 //     // contentSumDoc: content,
    //                 //     displayName: displayName,
    //                 //     numpages: numpages,
    //                 //     type: type,
    //                 //     dataBase64: dataBase64

    //                 //     // documentId: documentId,
    //                 //     // displayName: displayName,
    //                 //     // numpages: numpages,
    //                 //     // type: type,
    //                 //     // content: content
    //                 // })
    //             }
    //             return res.send(
    //                 onError(404, `Thư mục cha không tồn tại!`)
    //             );
    //             // let content = ""
    //             // let displayName = ""
    //             // let numpages = 0
    //             // let dataBase64 = ""
    //             // let fileDataInfo = []
    //             // // 0: text (dữ liệu người dùng nhập)
    //             // // 1: dữ liệu file pdf
    //             // // 2: dữ liệu file docx
    //             // // 3: dữ liệu file doc
    //             // let type = 1
    //             // if (req.files.length !== 0) {
    //             //     for (let i = 0; i < req.files.length; i++) {
    //             //         const { fieldname, filename } = req.files[i];
    //             //         // Đọc lần lượt nội dung của file upload lên
    //             //         try {
    //             //             // read binary data
    //             //             // var bitmap = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
    //             //             // convert binary data to base64 encoded string
    //             //             // dataBase64 = new Buffer.from(bitmap).toString('base64');
    //             //             // console.log('dataBase64 : ', dataBase64)
    //             //             // fs.writeFile('test.txt', result, err => {
    //             //             //     if (err) {
    //             //             //         console.error(err);
    //             //             //     }
    //             //             //     // file written successfully
    //             //             // });
    //             //             if (filename.split('.').pop() === "pdf") {
    //             //                 let pdfBuffer = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
    //             //                 const doc = await pdf(pdfBuffer)
    //             //                 // content = doc.text
    //             //                 numpages = doc.numpages
    //             //                 displayName = filename
    //             //                 type = 1
    //             //             } else {
    //             //                 if (filename.split('.').pop() === "docx") {
    //             //                     // const doc = await extractor.extract(`${FILE_KEY_TOPIC}/${filename}`)
    //             //                     // content = doc.getBody()
    //             //                     // const docx = await getPageCount(`${FILE_KEY_TOPIC}/${filename}`)
    //             //                     // const docx = DocExtractor.numberPages(`${FILE_KEY_TOPIC}/${filename}`)
    //             //                     // console.log('vào đây 1')
    //             //                     // let docxBuffer = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
    //             //                     // console.log('vào đây 2')
    //             //                     // const pagesDocx = await DocxCounter.count(docxBuffer);
    //             //                     // console.log('vào đây 3')
    //             //                     numpages = null
    //             //                     displayName = filename
    //             //                     type = 2
    //             //                 } else {
    //             //                     if (filename.split('.').pop() === "doc") {
    //             //                         // const doc = DocExtractor.numberPages(`${FILE_KEY_TOPIC}/${filename}`)
    //             //                         // let docBuffer = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
    //             //                         // const pagesDoc = await DocxCounter.count(docBuffer);
    //             //                         numpages = null
    //             //                         displayName = filename
    //             //                         type = 3
    //             //                     }
    //             //                 }
    //             //             }
    //             //             // Xoá file vừa đọc trên ổ đĩa
    //             //             // fs.rmSync(`${FILE_KEY_TOPIC}/${filename}`, { recursive: true, force: true });
    //             //         } catch (error) {
    //             //             console.log('error : ', error)
    //             //         }
    //             //     }
    //             // }
    //             // Trả về thông tin tên hiển thị, số trang, kiểu file tải lên
    //             // console.log(displayName, numpages, type)
    //         })
    //     } catch (error) {
    //         return res.send(onError(500, error));
    //     }
    // },
    // API lựa chọn doc từ driver và trả về thông tin doc
    selectSumDoc: async (req, res) => {
        try {
            const { userId } = req.user;
            const { documentId } = req.body;
            // Trả về thông tin tên hiển thị, số trang, kiểu file tải lên
            let displayName = ""
            let content = ""
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
                    // let pdfBuffer = fs.readFileSync(pathDoc);
                    // const doc = await pdf(pdfBuffer)
                    // content = doc.text
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
                        displayName = documentInfo.displayName
                        content = documentInfo.content
                        type = 2
                    } else {
                        if (documentInfo.typeOfFile.displayName === ".doc") {
                            // const doc = DocExtractor.numberPages(`${FILE_KEY_TOPIC}/${filename}`)
                            // let docBuffer = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
                            // const pagesDoc = await DocxCounter.count(docBuffer);
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
                type: type,
                content: content
            }));
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API thêm mới bản ghi tóm tắt đơn/ đa văn bản
    addSumResult: async (req, res) => {
        try {
            const { userId } = req.user;
            const { inMultiDocSumId, inClusterId, cluster, responseAISum, docNotSum, singleSumary } = req.body
            // const result = {
            //     cluster: [
            //         {
            //             "text": "Kết quả tóm tắt theo cụm 1",
            //             "displayName": "Cụm 1",
            //             "elem_arr": [0, 2],
            //             "percentLong": 0.05, // Phần trăm tóm tắt
            //             "mapAlgTypeAIId": 25, // Thuật toán sử dụng,
            //         },
            //         {
            //             "text": "Kết quả tóm tắt theo cụm 2",
            //             "displayName": "Cụm 2",
            //             "elem_arr": [1, 3],
            //             "percentLong": 0.05, // Phần trăm tóm tắt
            //             "mapAlgTypeAIId": 25, // Thuật toán sử dụng
            //         }
            //     ],
            //     topic: [
            //         {
            //             "text": "Kết quả tóm tắt theo chủ đề 3",
            //             "topicId": 61,
            //             "elem_arr": [0, 2],
            //             "percentLong": 0.05, // Phần trăm tóm tắt
            //             "mapAlgTypeAIId": 25, // Thuật toán sử dụng
            //         },
            //         {
            //             "text": "Kết quả tóm tắt theo chủ đề 4",
            //             "topicId": 62,
            //             "elem_arr": [1, 3],
            //             "percentLong": 0.05, // Phần trăm tóm tắt
            //             "mapAlgTypeAIId": 25, // Thuật toán sử dụng
            //         }
            //     ]
            // }
            // Cấu trúc data đối với đơn văn bản
            // Nếu không có chủ đề thì sẽ là phân cụm (1 cụm)
            // cluster: [
            //     {
            //         "text": "Kết quả tóm tắt theo cụm 1",
            //         "displayName": "Cụm 1",
            //         "elem_arr": [0],
            //         "percentLong": 0.05, // Phần trăm tóm tắt
            //         "mapAlgTypeAIId": 25, // Thuật toán sử dụng,
            //     },
            // ],
            // topic: [
            //     {
            //         "text": "Kết quả tóm tắt theo chủ đề 3",
            //         "topicId": 61,
            //         "elem_arr": [0],
            //         "percentLong": 0.05, // Phần trăm tóm tắt
            //         "mapAlgTypeAIId": 25, // Thuật toán sử dụng
            //     },
            //     {
            //         "text": "Kết quả tóm tắt theo chủ đề 4",
            //         "topicId": 62,
            //         "elem_arr": [0],
            //         "percentLong": 0.05, // Phần trăm tóm tắt
            //         "mapAlgTypeAIId": 25, // Thuật toán sử dụng
            //     }
            // ]

            let multiDocSumId = inMultiDocSumId
            // console.log('inMultiDocSumId : ', inMultiDocSumId)
            if (multiDocSumId) {
                // Thực hiện cập nhật bản ghi
                // Truy vấn kết quả theo inMultiDocSumId
                const resultSumDoc = await multiDocSumResults.findOne({
                    where: {
                        multiDocSumId: inMultiDocSumId,
                        ownerId: userId,
                    }
                })
                // Truy vấn tất cả bản ghi trong bảng clusterMultiDoc theo multiDocSumId
                const resultClusterDoc = await clusterMultiDoc.findAll({
                    where: {
                        multiDocSumId: inMultiDocSumId,
                    }
                })
                // Lấy ra danh sách clusterId
                const listClusterId = resultClusterDoc.map(x => x.clusterId)
                console.log('listClusterId : ', listClusterId)
                // Xoá các bản ghi trong multiDoc có clusterId nằm trong listClusterId
                await multiDoc.destroy({
                    where: {
                        clusterId: {
                            [Op.in]: listClusterId
                        }
                    },
                });
                // Lấy ra danh sách multiDocSumId
                const listMultiDocSumId = resultClusterDoc.map(x => x.multiDocSumId)
                console.log('listMultiDocSumId : ', listMultiDocSumId)
                // Xoá các bản ghi trong clusterMultiDoc có multiDocSumId nằm trong listMultiDocSumId
                await clusterMultiDoc.destroy({
                    where: {
                        multiDocSumId: {
                            [Op.in]: listMultiDocSumId
                        }
                    },
                });
                // Cập nhật thời gian update multiDocSumResults
                resultSumDoc.lastModify = new Date()
                resultSumDoc.IdDocSum = docNotSum
                await resultSumDoc.save()
            } else {
                // Thêm mới 1 bản ghi trong multiDocSumResults với ownerId = userId
                const result = await multiDocSumResults.create({
                    ownerId: userId,
                    enable: true,
                    IdDocSum: docNotSum,
                    singleSumary: singleSumary || false
                })
                multiDocSumId = result.multiDocSumId
                // Kiểm tra xem đang tóm tắt theo chủ đề hay phân cụm
            }
            // Tạo mới bản ghi trong clusterMultiDoc (Lưu giữ bản ghi tóm tắt theo từng chủ đề hoặc theo cụm)
            for (let index = 0; index < responseAISum.length; index++) {
                const element = responseAISum[index];
                const sumBodyData = cluster ? {
                    displayName: element.displayName
                } : {
                    topicId: element.topicId,
                }
                const clusterSum = {
                    multiDocSumId: multiDocSumId,
                    contentSumary: element.text, // Kết quả tóm tắt
                    percentLong: element.percentLong, // Phần trăm tóm tắt
                    mapAlgTypeAIId: element.mapAlgTypeAIId, // Thuật toán sử dụng
                    ...sumBodyData
                }
                // Tạo mới bản ghi
                console.log('clusterSum : ', clusterSum)
                const resultClusterSum = await clusterMultiDoc.create(clusterSum)
                // Dùng vòng lặp với element.elem_arr
                for (let a = 0; a < element.elem_arr.length; a++) {
                    const e = element.elem_arr[a];
                    // Tạo từng bản ghi trong multiDoc
                    const multiDocItem = {
                        clusterId: resultClusterSum.clusterId,
                        documentId: e,
                    }
                    await multiDoc.create(multiDocItem)
                }
            }
            // Thêm tóm tắt thành công
            return res.send(onSuccess({ multiDocSumId }));
        } catch (error) {
            console.log('error : ', error)
            return res.send(onError(500, error));
        }
    },
    // API lấy danh sách kết quả tóm tắt
    getSumDoc: async (req, res) => {
        const { userId } = req.user;
        const pagination = req.pagination;
        const {
            singleSumary,
            pageSize = PAGINATION_CONSTANTS.default_size,
            pageIndex = PAGINATION_CONSTANTS.default_index,
        } = req.query;

        // var arrAIId = [CORE_AI_SUMDOC.SINGLE_SHORT_SUM, CORE_AI_SUMDOC.SINGLE_LONG_SUM]
        // if (!singleSumary) {
        //     arrAIId = [CORE_AI_SUMDOC.MULTI_SUM_DOC]
        // }
        // Lấy danh sách listMapAITypeAI
        // const listMapAI = await mapAlgTypeAI.findAll({
        //     where: {
        //         aiId: {
        //             [Op.in]: arrAIId
        //         }
        //     }
        // })
        // const listMapAITypeAI = listMapAI.map(e => e.mapAlgTypeAIId)

        // Thêm bộ lọc
        var filterParams = {
            enable: true,
            ownerId: userId,
            singleSumary: singleSumary || false
        }
        // Truy vấn
        var filterQuery = {
            offset: pagination.offset,
            limit: pagination.limit,
            order: [["createdDate", "DESC"], [{ model: clusterMultiDoc, as: 'clusterMultiDocs' }, "clusterId", "ASC"]],
            where: filterParams,
            distinct: true,
            include: {
                model: clusterMultiDoc,
                as: "clusterMultiDocs",
                // Chỉ lấy các thuộc tính
                // attributes: ["topicId", "displayName"],
                include: [
                    {
                        model: mapAlgTypeAI,
                        as: "mapAlgTypeAI",
                        // where: {
                        //     mapAlgTypeAIId: {
                        //         [Op.in]: listMapAITypeAI
                        //     }
                        // },
                        include: [{
                            model: typeAI,
                            as: "typeAI",
                        }, {
                            model: algorithm,
                            as: "algor",
                        }]
                    },
                    {
                        model: topic,
                        as: "topic",
                        attributes: ["topicId", "displayName"],
                    }]
            }
        }
        // Thực hiện truy vấn kết quả
        const { count, rows } = await multiDocSumResults.findAndCountAll(filterQuery);
        // console.log('---- count : ',count)

        let data = []

        if (rows.length !== 0) {
            for (let index = 0; index < rows.length; index++) {
                const element = rows[index];
                let clusterMultiDocs = []
                for (let i = 0; i < element.clusterMultiDocs.length; i++) {
                    const e = element.clusterMultiDocs[i];
                    // Lấy multiDoc theo điều kiện clusterId = e.clusterId
                    const multiDocItem = await multiDoc.findAll({
                        where: {
                            clusterId: e.clusterId
                        },
                        include: [{
                            model: documents,
                            as: "document",
                            where: {
                                enable: true
                            },
                            // Chỉ lấy các thuộc tính
                            attributes: ["enable", "content", "displayName", "typeOfFileId"],
                            include: {
                                model: typeOfFile,
                                as: "typeOfFile",
                            },
                        }]
                    })
                    clusterMultiDocs.push({
                        clusterId: e.clusterId,
                        contentSumary: e.contentSumary,
                        description: e.description,
                        displayName: e.displayName,
                        enable: e.enable,
                        keywords: e.keywords,
                        mapAlgTypeAI: e.mapAlgTypeAI,
                        mapAlgTypeAIId: e.mapAlgTypeAIId,
                        multiDocSumId: e.multiDocSumId,
                        percentLong: e.percentLong,
                        topic: e.topic,
                        topicId: e.topicId,
                        multiDoc: multiDocItem
                    })
                }
                data.push({
                    multiDocSumId: element.multiDocSumId,
                    ownerId: element.ownerId,
                    createdDate: element.createdDate,
                    lastModify: element.lastModify,
                    IdDocSum: element.IdDocSum,
                    clusterMultiDocs: clusterMultiDocs,
                })
            }
        }

        const results = data.map((e) => {
            return onMultiDocSumFormat(e);
        });
        return res.send(onSuccess({
            listDocSums: results,
            pageSize: parseInt(pageSize),
            pageIndex: parseInt(pageIndex),
            count,
        }));
    },
    // API xoá kết quả tóm tắt
    deleteDocSum: async (req, res) => {
        try {
            const { userId } = req.user;
            const { inMultiDocSumId } = req.params;
            // Tìm docSumInfo theo docSumId
            const docSumInfo = await multiDocSumResults.findOne({
                where: {
                    multiDocSumId: inMultiDocSumId,
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
    // API dowload kết quả tóm tắt đa văn bản
    downloadDocSum: async (req, res) => {
        try {
            const { userId } = req.user;
            const { inDisplayName, inDocSumId, contentSumDoc } = req.body;
            const timestamp = Math.floor(new Date().getTime() / 1000);
            const pathDoc = `${CACHE_DOCS}/Tóm tắt-${inDisplayName.split(".")[0]}-${timestamp}.docx`;
            fs.writeFileSync(pathDoc, contentSumDoc);
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
}