package com.curso.controller;

import com.curso.model.Equipment;
import com.curso.repository.EquipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentRepository repository;

    public EquipmentController(EquipmentRepository repository) {
        this.repository = repository;
    }

    // CREATE: crear un equipo
    @PostMapping
    public ResponseEntity<Equipment> create(
            @RequestBody Equipment equipment) {

        equipment.setId(null);

        Equipment saved = repository.save(equipment);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    // READ: obtener todos los equipos
    @GetMapping
    public ResponseEntity<List<Equipment>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    // READ: obtener un equipo por ID
    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getById(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build());
    }

    // UPDATE: actualizar un equipo existente
    @PutMapping("/{id}")
    public ResponseEntity<Equipment> update(
            @PathVariable Long id,
            @RequestBody Equipment equipment) {

        return repository.findById(id)
                .map(existing -> {
                    existing.setName(equipment.getName());
                    existing.setAssetCode(
                            equipment.getAssetCode());
                    existing.setLocation(
                            equipment.getLocation());
                    existing.setNextMaintenanceDate(
                            equipment.getNextMaintenanceDate());
                    existing.setActive(equipment.getActive());

                    Equipment updated =
                            repository.save(existing);

                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build());
    }

    // DELETE: eliminar un equipo
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
