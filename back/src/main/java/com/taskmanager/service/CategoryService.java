package com.taskmanager.service;

import com.taskmanager.dto.CategoryDTO;
import com.taskmanager.model.Category;
import com.taskmanager.model.User;
import com.taskmanager.repository.CategoryRepository;
import com.taskmanager.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SecurityUtils securityUtils;

    public CategoryService(CategoryRepository categoryRepository, SecurityUtils securityUtils) {
        this.categoryRepository = categoryRepository;
        this.securityUtils = securityUtils;
    }

    public List<CategoryDTO> findAll() {
        Long usuarioId = securityUtils.getCurrentUserId();
        return categoryRepository.findByUsuarioId(usuarioId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CategoryDTO findById(Long id) {
        Long usuarioId = securityUtils.getCurrentUserId();
        Category category = categoryRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return toDTO(category);
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        User usuario = securityUtils.getCurrentUser();
        Category category = new Category(dto.getNombre(), usuario);
        Category saved = categoryRepository.save(category);
        return toDTO(saved);
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Long usuarioId = securityUtils.getCurrentUserId();
        Category category = categoryRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setNombre(dto.getNombre());
        Category saved = categoryRepository.save(category);
        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        Long usuarioId = securityUtils.getCurrentUserId();
        if (!categoryRepository.existsByIdAndUsuarioId(id, usuarioId)) {
            throw new RuntimeException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDTO toDTO(Category category) {
        return new CategoryDTO(category.getId(), category.getNombre());
    }
}
