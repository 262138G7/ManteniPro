package com.curso.model;

import java.sql.Timestamp;

public class MaintenanceLog {
    private Long id;
    private Long orderId;
    private String description;
    private Timestamp performedAt;
    private String notes;
}
