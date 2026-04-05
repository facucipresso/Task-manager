package com.taskmanager.service;

import com.taskmanager.dto.CategoryDTO;
import com.taskmanager.model.Category;
import com.taskmanager.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDTO> findAll() {
        return categoryRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CategoryDTO findById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return toDTO(category);
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        Category category = new Category(dto.getNombre());
        Category saved = categoryRepository.save(category);
        return toDTO(saved);
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setNombre(dto.getNombre());
        Category saved = categoryRepository.save(category);
        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDTO toDTO(Category category) {
        return new CategoryDTO(category.getId(), category.getNombre());
    }
}
