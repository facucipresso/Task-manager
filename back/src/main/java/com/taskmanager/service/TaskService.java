package com.taskmanager.service;

import com.taskmanager.dto.TaskDTO;
import com.taskmanager.model.Category;
import com.taskmanager.model.Task;
import com.taskmanager.repository.CategoryRepository;
import com.taskmanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;

    public TaskService(TaskRepository taskRepository, CategoryRepository categoryRepository) {
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<TaskDTO> findAll() {
        return taskRepository.findAllOrderByFechaLimiteAndPriority().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> findByCategoryId(Long categoryId) {
        return taskRepository.findByCategoriaIdOrderByFechaLimiteAndPriority(categoryId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TaskDTO findById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        return toDTO(task);
    }

    @Transactional
    public TaskDTO create(TaskDTO dto) {
        Category category = categoryRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + dto.getCategoriaId()));

        Task task = new Task();
        task.setNombre(dto.getNombre());
        task.setDescripcion(dto.getDescripcion());
        task.setEstado(dto.getEstado() != null ? dto.getEstado() : "pending");
        task.setFechaLimite(dto.getFechaLimite());
        task.setPriority(dto.getPriority() != null ? dto.getPriority() : "medium");
        task.setCategoria(category);

        Task saved = taskRepository.save(task);
        return toDTO(saved);
    }

    @Transactional
    public TaskDTO update(Long id, TaskDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        task.setNombre(dto.getNombre());
        task.setDescripcion(dto.getDescripcion());
        task.setEstado(dto.getEstado());
        task.setFechaLimite(dto.getFechaLimite());
        task.setPriority(dto.getPriority());

        if (dto.getCategoriaId() != null) {
            Category category = categoryRepository.findById(dto.getCategoriaId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + dto.getCategoriaId()));
            task.setCategoria(category);
        }

        Task saved = taskRepository.save(task);
        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    private TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setNombre(task.getNombre());
        dto.setDescripcion(task.getDescripcion());
        dto.setEstado(task.getEstado());
        dto.setFechaLimite(task.getFechaLimite());
        dto.setPriority(task.getPriority());
        dto.setCategoriaId(task.getCategoria().getId());
        return dto;
    }
}
