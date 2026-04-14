package com.taskmanager.repository;

import com.taskmanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE t.categoria.usuario.id = :usuarioId ORDER BY t.fechaLimite ASC, " +
           "CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC")
    List<Task> findAllByUsuarioIdOrderByFechaLimiteAndPriority(@Param("usuarioId") Long usuarioId);

    @Query("SELECT t FROM Task t WHERE t.categoria.id = :categoryId AND t.categoria.usuario.id = :usuarioId ORDER BY t.fechaLimite ASC, " +
           "CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC")
    List<Task> findByCategoriaIdAndUsuarioIdOrderByFechaLimiteAndPriority(@Param("categoryId") Long categoryId, @Param("usuarioId") Long usuarioId);

    @Query("SELECT t FROM Task t WHERE t.id = :taskId AND t.categoria.usuario.id = :usuarioId")
    Optional<Task> findByIdAndUsuarioId(@Param("taskId") Long taskId, @Param("usuarioId") Long usuarioId);

    @Query("SELECT t FROM Task t ORDER BY t.fechaLimite ASC, " +
           "CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC")
    List<Task> findAllOrderByFechaLimiteAndPriority();

    @Query("SELECT t FROM Task t WHERE t.categoria.id = :categoryId ORDER BY t.fechaLimite ASC, " +
           "CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC")
    List<Task> findByCategoriaIdOrderByFechaLimiteAndPriority(@Param("categoryId") Long categoryId);
}
