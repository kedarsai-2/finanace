package com.finance.app.web.rest;

import com.finance.app.repository.InvoiceLineRepository;
import com.finance.app.service.InvoiceLineService;
import com.finance.app.service.dto.InvoiceLineDTO;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.finance.app.domain.InvoiceLine}.
 */
@RestController
@RequestMapping("/api/invoice-lines")
public class InvoiceLineResource {

    private static final Logger LOG = LoggerFactory.getLogger(InvoiceLineResource.class);

    private static final String ENTITY_NAME = "invoiceLine";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final InvoiceLineService invoiceLineService;

    private final InvoiceLineRepository invoiceLineRepository;

    public InvoiceLineResource(InvoiceLineService invoiceLineService, InvoiceLineRepository invoiceLineRepository) {
        this.invoiceLineService = invoiceLineService;
        this.invoiceLineRepository = invoiceLineRepository;
    }

    /**
     * {@code POST  /invoice-lines} : Create a new invoiceLine.
     *
     * @param invoiceLineDTO the invoiceLineDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new invoiceLineDTO, or with status {@code 400 (Bad Request)} if the invoiceLine has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<InvoiceLineDTO> createInvoiceLine(@Valid @RequestBody InvoiceLineDTO invoiceLineDTO) throws URISyntaxException {
        LOG.debug("REST request to save InvoiceLine : {}", invoiceLineDTO);
        if (invoiceLineDTO.getId() != null) {
            throw new BadRequestAlertException("A new invoiceLine cannot already have an ID", ENTITY_NAME, "idexists");
        }
        invoiceLineDTO = invoiceLineService.save(invoiceLineDTO);
        return ResponseEntity.created(new URI("/api/invoice-lines/" + invoiceLineDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, invoiceLineDTO.getId().toString()))
            .body(invoiceLineDTO);
    }

    /**
     * {@code PUT  /invoice-lines/:id} : Updates an existing invoiceLine.
     *
     * @param id the id of the invoiceLineDTO to save.
     * @param invoiceLineDTO the invoiceLineDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated invoiceLineDTO,
     * or with status {@code 400 (Bad Request)} if the invoiceLineDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the invoiceLineDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<InvoiceLineDTO> updateInvoiceLine(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody InvoiceLineDTO invoiceLineDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update InvoiceLine : {}, {}", id, invoiceLineDTO);
        if (invoiceLineDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, invoiceLineDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!invoiceLineRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        invoiceLineDTO = invoiceLineService.update(invoiceLineDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, invoiceLineDTO.getId().toString()))
            .body(invoiceLineDTO);
    }

    /**
     * {@code PATCH  /invoice-lines/:id} : Partial updates given fields of an existing invoiceLine, field will ignore if it is null
     *
     * @param id the id of the invoiceLineDTO to save.
     * @param invoiceLineDTO the invoiceLineDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated invoiceLineDTO,
     * or with status {@code 400 (Bad Request)} if the invoiceLineDTO is not valid,
     * or with status {@code 404 (Not Found)} if the invoiceLineDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the invoiceLineDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<InvoiceLineDTO> partialUpdateInvoiceLine(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody InvoiceLineDTO invoiceLineDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update InvoiceLine partially : {}, {}", id, invoiceLineDTO);
        if (invoiceLineDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, invoiceLineDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!invoiceLineRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<InvoiceLineDTO> result = invoiceLineService.partialUpdate(invoiceLineDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, invoiceLineDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /invoice-lines} : get all the Invoice Lines.
     *
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Invoice Lines in body.
     */
    @GetMapping("")
    public List<InvoiceLineDTO> getAllInvoiceLines(
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get all InvoiceLines");
        return invoiceLineService.findAll();
    }

    /**
     * {@code GET  /invoice-lines/:id} : get the "id" invoiceLine.
     *
     * @param id the id of the invoiceLineDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the invoiceLineDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceLineDTO> getInvoiceLine(@PathVariable("id") Long id) {
        LOG.debug("REST request to get InvoiceLine : {}", id);
        Optional<InvoiceLineDTO> invoiceLineDTO = invoiceLineService.findOne(id);
        return ResponseUtil.wrapOrNotFound(invoiceLineDTO);
    }

    /**
     * {@code DELETE  /invoice-lines/:id} : delete the "id" invoiceLine.
     *
     * @param id the id of the invoiceLineDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoiceLine(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete InvoiceLine : {}", id);
        invoiceLineService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
