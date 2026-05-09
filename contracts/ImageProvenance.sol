// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ImageProvenance {
    struct ImageRecord {
        bytes32 imageHash;
        string ipfsCid;
        string modelName;
        string prompt;
        uint8 confidenceScore;
        address creator;
        uint256 timestamp;
    }

    struct VerificationRecord {
        address verifier;
        uint8 newScore;
        string remark;
        uint256 timestamp;
    }

    error ImageAlreadyRegistered(bytes32 imageHash);
    error ImageNotFound(bytes32 imageHash);
    error InvalidConfidenceScore(uint8 score);
    error EmptyIpfsCid();

    mapping(bytes32 => ImageRecord) private imageRecords;
    mapping(bytes32 => VerificationRecord[]) private verificationHistory;
    mapping(bytes32 => bool) private imageExists;

    event ImageRegistered(
        bytes32 indexed imageHash,
        string ipfsCid,
        string modelName,
        uint8 confidenceScore,
        address indexed creator,
        uint256 timestamp
    );

    event VerificationAdded(
        bytes32 indexed imageHash,
        address indexed verifier,
        uint8 newScore,
        string remark,
        uint256 timestamp
    );

    function registerImage(
        bytes32 imageHash,
        string calldata ipfsCid,
        string calldata modelName,
        string calldata prompt,
        uint8 confidenceScore
    ) external {
        if (imageExists[imageHash]) {
            revert ImageAlreadyRegistered(imageHash);
        }
        if (bytes(ipfsCid).length == 0) {
            revert EmptyIpfsCid();
        }
        if (confidenceScore > 100) {
            revert InvalidConfidenceScore(confidenceScore);
        }

        imageRecords[imageHash] = ImageRecord({
            imageHash: imageHash,
            ipfsCid: ipfsCid,
            modelName: modelName,
            prompt: prompt,
            confidenceScore: confidenceScore,
            creator: msg.sender,
            timestamp: block.timestamp
        });

        imageExists[imageHash] = true;

        emit ImageRegistered(
            imageHash,
            ipfsCid,
            modelName,
            confidenceScore,
            msg.sender,
            block.timestamp
        );
    }

    function addVerification(
        bytes32 imageHash,
        uint8 newScore,
        string calldata remark
    ) external {
        if (!imageExists[imageHash]) {
            revert ImageNotFound(imageHash);
        }
        if (newScore > 100) {
            revert InvalidConfidenceScore(newScore);
        }

        verificationHistory[imageHash].push(
            VerificationRecord({
                verifier: msg.sender,
                newScore: newScore,
                remark: remark,
                timestamp: block.timestamp
            })
        );

        imageRecords[imageHash].confidenceScore = newScore;

        emit VerificationAdded(
            imageHash,
            msg.sender,
            newScore,
            remark,
            block.timestamp
        );
    }

    function getImageRecord(
        bytes32 imageHash
    ) external view returns (ImageRecord memory) {
        if (!imageExists[imageHash]) {
            revert ImageNotFound(imageHash);
        }

        return imageRecords[imageHash];
    }

    function getVerificationCount(
        bytes32 imageHash
    ) external view returns (uint256) {
        if (!imageExists[imageHash]) {
            revert ImageNotFound(imageHash);
        }

        return verificationHistory[imageHash].length;
    }

    function getVerification(
        bytes32 imageHash,
        uint256 index
    ) external view returns (VerificationRecord memory) {
        if (!imageExists[imageHash]) {
            revert ImageNotFound(imageHash);
        }

        return verificationHistory[imageHash][index];
    }
}
