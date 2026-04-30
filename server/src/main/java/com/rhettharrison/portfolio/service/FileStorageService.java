package com.rhettharrison.portfolio.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Map<String, String> CONTENT_TYPE_TO_EXT = Map.of(
        "image/png", "png",
        "image/jpeg", "jpg",
        "image/jpg", "jpg",
        "image/gif", "gif",
        "image/webp", "webp"
    );

    @Value("${app.uploads.dir:./uploads}")
    private String uploadsDir;

    private Path rootPath;

    @PostConstruct
    void init() throws IOException {
        rootPath = Paths.get(uploadsDir).toAbsolutePath().normalize();
        Files.createDirectories(rootPath.resolve("blog"));
    }

    public Path getRootPath() {
        return rootPath;
    }

    public StoredFile storeBlogImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String contentType = file.getContentType();
        String ext = CONTENT_TYPE_TO_EXT.get(contentType == null ? "" : contentType.toLowerCase());
        if (ext == null) {
            throw new IllegalArgumentException("Unsupported image type: " + contentType);
        }

        String filename = UUID.randomUUID() + "." + ext;
        Path target = rootPath.resolve("blog").resolve(filename).normalize();
        if (!target.startsWith(rootPath)) {
            throw new IllegalArgumentException("Invalid file path");
        }

        try (var in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return new StoredFile(filename, "/uploads/blog/" + filename);
    }

    public record StoredFile(String filename, String url) {}
}
