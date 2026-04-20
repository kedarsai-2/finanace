package com.finance.app.web.rest;

import com.finance.app.repository.PurchaseLineRepository;
import com.finance.app.service.PurchaseLineService;
import com.finance.app.service.dto.PurchaseLineDTO;
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
 * REST controller for managing {@link com.finance.app.domain.PurchaseLine}.
 */
@RestController
@RequestMapping("/api/purchase-lines")
public class PurchaseLineResource {

    private static final Logger LOG = LoggerFactory.getLogger(PurchaseLineResource.class);

    private static final String ENTITY_NAME = "purchaseLine";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final PurchaseLineService purchaseLineService;

    private final PurchaseLineRepository purchaseLineRepository;

    public PurchaseLineResource(PurchaseLineService purchaseLineService, PurchaseLineRepository purchaseLineRepository) {
        this.purchaseLineService = purchaseLineService;
        this.purchaseLineRepository = purchaseLineRepository;
    }

    /**
     * {@code POST  /purchase-lines} : Create a new purchaseLine.
     *
     * @param purchaseLineDTO the purchaseLineDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new purchaseLineDTO, or with status {@code 400 (Bad Request)} if the purchaseLine has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<PurchaseLineDTO> createPurchaseLine(@Valid @RequestBody PurchaseLineDTO purchaseLineDTO)
        throws URISyntaxException {
        LOG.debug("REST request to save PurchaseLine : {}", purchaseLineDTO);
        if (purchaseLineDTO.getId() != null) {
            throw new BadRequestAlertException("A new purchaseLine cannot already have an ID", ENTITY_NAME, "idexists");
        }
        purchaseLineDTO = purchaseLineService.save(purchaseLineDTO);
        return ResponseEntity.created(new URI("/api/purchase-lines/" + purchaseLineDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, purchaseLineDTO.getId().toString()))
            .body(purchaseLineDTO);
    }

    /**
     * {@code PUT  /purchase-lines/:id} : Updates an existing purchaseLine.
     *
     * @param id the id of the purchaseLineDTO to save.
     * @param purchaseLineDTO the purchaseLineDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated purchaseLineDTO,
     * or with status {@code 400 (Bad Request)} if the purchaseLineDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the purchaseLineDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseLineDTO> updatePurchaseLine(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody PurchaseLineDTO purchaseLineDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update PurchaseLine : {}, {}", id, purchaseLineDTO);
        if (purchaseLineDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, purchaseLineDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!purchaseLineRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        purchaseLineDTO = purchaseLineService.update(purchaseLineDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, purchaseLineDTO.getId().toString()))
            .body(purchaseLineDTO);
    }

    /**
     * {@code PATCH  /purchase-lines/:id} : Partial updates given fields of an existing purchaseLine, field will ignore if it is null
     *
     * @param id the id of the purchaseLineDTO to save.
     * @param purchaseLineDTO the purchaseLineDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated purchaseLineDTO,
     * or with status {@code 400 (Bad Request)} if the purchaseLineDTO is not valid,
     * or with status {@code 404 (Not Found)} if the purchaseLineDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the purchaseLineDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<PurchaseLineDTO> partialUpdatePurchaseLine(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody PurchaseLineDTO purchaseLineDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update PurchaseLine partially : {}, {}", id, purchaseLineDTO);
        if (purchaseLineDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, purchaseLineDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!purchaseLineRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<PurchaseLineDTO> result = purchaseLineService.partialUpdate(purchaseLineDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, purchaseLineDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /purchase-lines} : get all the Purchase Lines.
     *
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Purchase Lines in body.
     */
    @GetMapping("")
    public List<PurchaseLineDTO> getAllPurchaseLines(
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get all PurchaseLines");
        return purchaseLineService.findAll();
    }

    /**
     * {@code GET  /purchase-lines/:id} : get the "id" purchaseLine.
     *
     * @param id the id of the purchaseLineDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the purchaseLineDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseLineDTO> getPurchaseLine(@PathVariable("id") Long id) {
        LOG.debug("REST request to get PurchaseLine : {}", id);
        Optional<PurchaseLineDTO> purchaseLineDTO = purchaseLineService.findOne(id);
        return ResponseUtil.wrapOrNotFound(purchaseLineDTO);
    }

    /**
     * {@code DELETE  /purchase-lines/:id} : delete the "id" purchaseLine.
     *
     * @param id the id of the purchaseLineDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseLine(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete PurchaseLine : {}", id);
        purchaseLineService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
